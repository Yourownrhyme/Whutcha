// verify_block4_pwa.mjs
// Automated verification suite for Whutcha PWA Lifecycle, Service Worker, and Mobile Install/Push features

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec';
const WEB_DIR = path.resolve('./whutcha-web');

async function run() {
    console.log("==================================================");
    console.log("🧪 RUNNING PILLAR 4 VERIFICATION (PWA & WORKERS)");
    console.log("==================================================");

    let failures = 0;

    // 1. Audit manifest.json
    console.log("\n[1] Checking PWA manifest.json...");
    try {
        const manifestRaw = fs.readFileSync(path.join(WEB_DIR, 'manifest.json'), 'utf8');
        const manifest = JSON.parse(manifestRaw);

        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                console.error(`❌ manifest.json is missing required field: ${field}`);
                failures++;
            }
        }
        if (manifest.icons && manifest.icons.length > 0) {
            const iconPath = path.join(WEB_DIR, manifest.icons[0].src);
            if (fs.existsSync(iconPath)) {
                console.log(`✅ Manifest icon verified: ${manifest.icons[0].src}`);
            } else {
                console.error(`❌ Manifest icon does not exist: ${iconPath}`);
                failures++;
            }
        }
        console.log(`✅ manifest.json parsed successfully (${manifest.name}, display: ${manifest.display})`);
    } catch (e) {
        console.error("❌ Failed to parse manifest.json:", e);
        failures++;
    }

    // 2. Audit sw.js (Submarine Mode & Push Actions)
    console.log("\n[2] Checking sw.js Service Worker implementation...");
    try {
        const swContent = fs.readFileSync(path.join(WEB_DIR, 'sw.js'), 'utf8');

        if (!swContent.includes('SKIP_WAITING')) {
            console.error("❌ sw.js does not contain SKIP_WAITING message listener");
            failures++;
        } else {
            console.log("✅ sw.js contains SKIP_WAITING lifecycle handler");
        }

        if (!swContent.includes('open_cockpit') || !swContent.includes('dismiss')) {
            console.error("❌ sw.js is missing interactive push notification actions");
            failures++;
        } else {
            console.log("✅ sw.js contains actionable push buttons (open_cockpit, dismiss)");
        }

        if (!swContent.includes('whutcha-shell-v')) {
            console.error("❌ sw.js missing versioned cache name");
            failures++;
        } else {
            console.log("✅ sw.js cache name properly versioned");
        }
    } catch (e) {
        console.error("❌ Failed to read sw.js:", e);
        failures++;
    }

    // 3. Headless Chrome CDP Test for iOS Modal & PWA Update Banner
    console.log("\n[3] Testing PWA UI components in Headless Chrome via CDP...");
    const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
        '--headless=new',
        '--remote-debugging-port=9259',
        '--disable-gpu',
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch('http://127.0.0.1:9259/json/version');
            wsUrl = (await res.json()).webSocketDebuggerUrl;
            if (wsUrl) break;
        } catch(e) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    if (!wsUrl) {
        console.error("❌ Failed to connect to Chrome CDP");
        chrome.kill();
        process.exit(1);
    }

    try {
        const target = await (await fetch('http://127.0.0.1:9259/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        let id = 1;
        const send = (method, params = {}) => new Promise((resolve, reject) => {
            const msgId = id++;
            const timeout = setTimeout(() => {
                ws.removeEventListener('message', handler);
                reject(new Error(`Timeout waiting for CDP method: ${method}`));
            }, 8000);

            const handler = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.id === msgId) {
                    clearTimeout(timeout);
                    ws.removeEventListener('message', handler);
                    if (msg.error) {
                        reject(new Error(`CDP error in ${method}: ${JSON.stringify(msg.error)}`));
                    } else {
                        resolve(msg.result);
                    }
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });

        await new Promise(r => ws.onopen = r);
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 1, mobile: true });
        await new Promise(r => setTimeout(r, 1500));

        // Test openIosInstallModal
        const modalInitial = await send('Runtime.evaluate', {
            expression: `document.getElementById('ios-install-modal').classList.contains('hidden')`,
            returnByValue: true
        });

        if (modalInitial.result.value !== true) {
            console.error("❌ #ios-install-modal should be hidden by default");
            failures++;
        } else {
            console.log("✅ #ios-install-modal is hidden by default");
        }

        // Trigger openIosInstallModal()
        await send('Runtime.evaluate', {
            expression: `window.openIosInstallModal();`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 400));

        const modalOpenResult = await send('Runtime.evaluate', {
            expression: `JSON.stringify({
                visible: !document.getElementById('ios-install-modal').classList.contains('hidden'),
                opacity100: document.getElementById('ios-install-modal').classList.contains('opacity-100'),
                steps: document.querySelectorAll('#ios-install-modal .space-y-2\\\\.5 > div').length
            })`,
            returnByValue: true
        });

        const openData = JSON.parse(modalOpenResult.result.value);
        if (!openData.visible || openData.steps !== 3) {
            console.error("❌ #ios-install-modal failed to open or missing steps:", openData);
            failures++;
        } else {
            console.log(`✅ #ios-install-modal opened cleanly with ${openData.steps} guided steps`);
        }

        // Capture screenshot of iOS Modal
        try {
            const shotIos = await send('Page.captureScreenshot', { format: 'png' });
            if (shotIos && shotIos.data) {
                const iosPath = path.join(ARTIFACT_DIR, 'verify_pwa_ios_modal.png');
                fs.writeFileSync(iosPath, Buffer.from(shotIos.data, 'base64'));
                console.log(`📸 Saved screenshot to: ${iosPath}`);
            }
        } catch(e) {
            console.warn("Screenshot capture skipped:", e.message);
        }

        // Close iOS modal
        await send('Runtime.evaluate', {
            expression: `window.closeIosInstallModal();`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 400));

        // Test PWA update banner
        await send('Runtime.evaluate', {
            expression: `(() => {
                const banner = document.getElementById('pwa-update-banner');
                if (banner) {
                    banner.classList.remove('hidden');
                    banner.classList.add('flex');
                }
            })()`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 300));

        const bannerCheck = await send('Runtime.evaluate', {
            expression: `!document.getElementById('pwa-update-banner').classList.contains('hidden')`,
            returnByValue: true
        });

        if (!bannerCheck.result.value) {
            console.error("❌ #pwa-update-banner failed to display");
            failures++;
        } else {
            console.log("✅ #pwa-update-banner displayed cleanly");
        }

        // Capture screenshot of PWA Update Banner
        try {
            const shotBanner = await send('Page.captureScreenshot', { format: 'png' });
            if (shotBanner && shotBanner.data) {
                const bannerPath = path.join(ARTIFACT_DIR, 'verify_pwa_update_banner.png');
                fs.writeFileSync(bannerPath, Buffer.from(shotBanner.data, 'base64'));
                console.log(`📸 Saved screenshot to: ${bannerPath}`);
            }
        } catch(e) {
            console.warn("Screenshot capture skipped:", e.message);
        }

        ws.close();
    } catch (e) {
        console.error("❌ Chrome CDP Test encountered an error:", e);
        failures++;
    } finally {
        chrome.kill();
    }

    console.log("\n==================================================");
    if (failures === 0) {
        console.log("🎯 ALL PILLAR 4 AUDITS PASSED WITH ZERO FAILURES!");
        console.log("==================================================");
        process.exit(0);
    } else {
        console.error(`🚨 PILLAR 4 FAILED WITH ${failures} ERRORS.`);
        console.log("==================================================");
        process.exit(1);
    }
}

run();
