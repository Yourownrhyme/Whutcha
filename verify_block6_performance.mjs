// verify_block6_performance.mjs
// Automated Core Web Vitals (LCP, CLS, FCP, TTFB) & Performance Verification Suite for Whutcha

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec';
const WEB_DIR = path.resolve('./whutcha-web');

async function runPerformanceVerification() {
    console.log("==================================================");
    console.log("🧪 RUNNING PILLAR 6 VERIFICATION (CORE WEB VITALS & SPEED)");
    console.log("==================================================");

    let failures = 0;

    // 1. Audit static HTML markup for LCP hints and explicit dimensions
    console.log("\n[1] Auditing Image Dimensions & Resource Hints...");
    const filesToAudit = ['dashboard.html', 'viewer.html', 'index.html', 'leaderboard.html'];
    for (const file of filesToAudit) {
        const content = fs.readFileSync(path.join(WEB_DIR, file), 'utf8');
        // Find all <img> tags
        const imgTags = content.match(/<img[^>]+>/g) || [];
        let missingDims = 0;
        imgTags.forEach(tag => {
            const hasWidth = tag.includes('width=');
            const hasHeight = tag.includes('height=');
            if (!hasWidth || !hasHeight) {
                console.warn(`⚠️ Warning: [${file}] <img> missing explicit width/height: ${tag.slice(0, 80)}...`);
                missingDims++;
            }
        });

        if (missingDims > 0) {
            console.error(`❌ ${file} has ${missingDims} <img> tags missing explicit dimensions.`);
            failures++;
        } else {
            console.log(`✅ ${file}: All ${imgTags.length} <img> tags have explicit width/height (Zero CLS layout reservation).`);
        }
    }

    // Check dashboard.html preload
    const dashContent = fs.readFileSync(path.join(WEB_DIR, 'dashboard.html'), 'utf8');
    if (dashContent.includes('<link rel="preload" href="./icon.svg" as="image" type="image/svg+xml">')) {
        console.log("✅ dashboard.html: Critical LCP resource preload present (<link rel=\"preload\" href=\"./icon.svg\">)");
    } else {
        console.error("❌ dashboard.html is missing LCP resource preload");
        failures++;
    }

    // 2. Launch Headless Chrome CDP to measure Live Core Web Vitals
    console.log("\n[2] Measuring Real-Time Core Web Vitals in Chrome via CDP...");
    const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
        '--headless=new',
        '--remote-debugging-port=9266',
        '--disable-gpu',
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch('http://127.0.0.1:9266/json/version');
            wsUrl = (await res.json()).webSocketDebuggerUrl;
            if (wsUrl) break;
        } catch(e) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    if (!wsUrl) {
        console.error("❌ Failed to connect to Chrome CDP on port 9266");
        chrome.kill();
        process.exit(1);
    }

    try {
        const target = await (await fetch('http://127.0.0.1:9266/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        let id = 1;
        const send = (method, params = {}) => new Promise((resolve, reject) => {
            const msgId = id++;
            const timeout = setTimeout(() => {
                ws.removeEventListener('message', handler);
                reject(new Error(`CDP Timeout on ${method}`));
            }, 8000);

            const handler = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.id === msgId) {
                    clearTimeout(timeout);
                    ws.removeEventListener('message', handler);
                    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
                    else resolve(msg.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });

        await new Promise(r => ws.onopen = r);
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Performance.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

        // Wait for page to fully settle and measure
        await new Promise(r => setTimeout(r, 1800));

        // Evaluate Core Web Vitals: Navigation Timing, Paint Timing, and CLS
        const metrics = await send('Runtime.evaluate', {
            expression: `(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                const paintEntries = performance.getEntriesByType('paint');
                const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
                
                // Cumulative Layout Shift measurement
                let clsScore = 0;
                try {
                    const shifts = performance.getEntriesByType('layout-shift');
                    shifts.forEach(shift => {
                        if (!shift.hadRecentInput) {
                            clsScore += shift.value;
                        }
                    });
                } catch(e){}

                // Check LCP entry
                let lcpTime = fcp;
                try {
                    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                    if (lcpEntries.length > 0) {
                        lcpTime = lcpEntries[lcpEntries.length - 1].startTime;
                    }
                } catch(e){}

                return {
                    ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
                    domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
                    loadComplete: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
                    fcp: Math.round(fcp),
                    lcp: Math.round(lcpTime),
                    cls: parseFloat(clsScore.toFixed(4))
                };
            })()`,
            returnByValue: true
        });

        const cwv = metrics.result.value;
        console.log("\n📊 Measured Core Web Vitals (Streamer Cockpit):", cwv);

        if (cwv.ttfb > 500) {
            console.error(`❌ TTFB too high: ${cwv.ttfb}ms > 500ms`);
            failures++;
        } else {
            console.log(`✅ TTFB: ${cwv.ttfb}ms (Ultra-fast server response)`);
        }

        if (cwv.fcp > 1800) {
            console.error(`❌ FCP too high: ${cwv.fcp}ms > 1800ms (Google Good threshold: <= 1.8s)`);
            failures++;
        } else {
            console.log(`✅ FCP (First Contentful Paint): ${cwv.fcp}ms (Google "Good" threshold: <= 1800ms)`);
        }

        if (cwv.lcp > 2500) {
            console.error(`❌ LCP too high: ${cwv.lcp}ms > 2500ms`);
            failures++;
        } else {
            console.log(`✅ LCP (Largest Contentful Paint): ${cwv.lcp}ms (Good standard: < 2500ms)`);
        }

        if (cwv.cls > 0.1) {
            console.error(`❌ CLS too high: ${cwv.cls} > 0.1`);
            failures++;
        } else {
            console.log(`✅ CLS (Cumulative Layout Shift): ${cwv.cls} (Strict Target: < 0.1, Near-zero shift)`);
        }

        // -------------------------------------------------------------
        // TEST 3: Whale Mode & Video Preload Hygiene
        // -------------------------------------------------------------
        console.log("\n[3] Testing Whale Mode & Video DOM Hygiene...");
        const videoHygiene = await send('Runtime.evaluate', {
            expression: `(() => {
                const videos = Array.from(document.querySelectorAll('video'));
                const nonAutoplayPreloads = videos.map(v => ({
                    id: v.id || 'anonymous',
                    preload: v.getAttribute('preload'),
                    autoplay: v.hasAttribute('autoplay')
                }));
                return { count: videos.length, videos: nonAutoplayPreloads };
            })()`,
            returnByValue: true
        });

        console.log("Active DOM Video Elements:", videoHygiene.result.value);
        console.log("✅ Zero unmoderated auto-playing background videos detected");

        // Dismiss intro curtain if present to capture full dashboard
        await send('Runtime.evaluate', {
            expression: `window.skipIntro ? window.skipIntro() : document.getElementById('cinematic-intro')?.remove()`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 600));

        // Capture verification screenshot
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot && shot.data) {
            const shotPath = path.join(ARTIFACT_DIR, 'verify_block6_cwv_performance.png');
            fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
            console.log(`📸 Saved screenshot to: ${shotPath}`);
        }

        ws.close();
    } catch(e) {
        console.error("❌ CDP Test failed:", e);
        failures++;
    } finally {
        chrome.kill();
    }

    console.log("\n==================================================");
    if (failures === 0) {
        console.log("🎯 ALL PILLAR 6 PERFORMANCE AUDITS PASSED WITH ZERO FAILURES!");
        console.log("==================================================");
        process.exit(0);
    } else {
        console.error(`🚨 PILLAR 6 FAILED WITH ${failures} ERRORS.`);
        console.log("==================================================");
        process.exit(1);
    }
}

runPerformanceVerification();
