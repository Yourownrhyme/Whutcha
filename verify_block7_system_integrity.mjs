// verify_block7_system_integrity.mjs
// Automated verification suite for Whutcha Pillar 7: Deep-linking, Observer Mode, Social OG Tags & Edge Cases

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec';
const WEB_DIR = path.resolve('./whutcha-web');

async function runSystemIntegrityVerification() {
    console.log("==================================================");
    console.log("🧪 RUNNING PILLAR 7 VERIFICATION (SYSTEM INTEGRITY & DEEP-LINKS)");
    console.log("==================================================");

    let failures = 0;

    // 1. Social OpenGraph & Twitter Card Meta Audit
    console.log("\n[1] Auditing OpenGraph & Twitter Card Metadata...");
    const htmlFiles = ['index.html', 'dashboard.html', 'viewer.html', 'leaderboard.html'];
    const requiredMeta = [
        'property="og:title"',
        'property="og:description"',
        'property="og:image"',
        'property="og:type"',
        'name="twitter:card"'
    ];

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(path.join(WEB_DIR, file), 'utf8');
        let fileMissing = 0;
        requiredMeta.forEach(meta => {
            if (!content.includes(meta)) {
                console.error(`❌ ${file} missing required meta tag: ${meta}`);
                fileMissing++;
            }
        });
        if (fileMissing === 0) {
            console.log(`✅ ${file}: 100% compliant with OpenGraph & Twitter Large Cards`);
        } else {
            failures += fileMissing;
        }
    });

    // 2. Launch Chrome CDP for In-Browser Deep-linking & Observer Mode Tests
    console.log("\n[2] Testing Deep-linking and Observer Mode via Chrome CDP...");
    const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
        '--headless=new',
        '--remote-debugging-port=9267',
        '--disable-gpu',
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch('http://127.0.0.1:9267/json/version');
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
        let id = 1;
        const connectTab = async (url) => {
            const target = await (await fetch(`http://127.0.0.1:9267/json/new?${url}`, { method: 'PUT' })).json();
            const ws = new WebSocket(target.webSocketDebuggerUrl);
            await new Promise(r => ws.onopen = r);

            const send = (method, params = {}) => new Promise((resolve, reject) => {
                const msgId = id++;
                const timeout = setTimeout(() => {
                    ws.removeEventListener('message', handler);
                    reject(new Error(`Timeout on ${method}`));
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

            await send('Page.enable');
            await send('Runtime.enable');
            return { ws, send };
        };

        // -------------------------------------------------------------
        // DEEP-LINK TEST 1: Viewer Portal Deep-linking (?streamer=LocoKwokka)
        // -------------------------------------------------------------
        console.log("\n[2.1] Testing Viewer Portal Deep-linking (?streamer=LocoKwokka)...");
        const tabViewer = await connectTab('http://localhost:3000/viewer.html?streamer=LocoKwokka');
        await new Promise(r => setTimeout(r, 1200));

        const viewerData = await tabViewer.send('Runtime.evaluate', {
            expression: `(() => {
                const name = document.getElementById('streamer-name')?.innerText || '';
                const presets = document.querySelectorAll('#price-presets button').length;
                return { name, presets };
            })()`,
            returnByValue: true
        });

        if (viewerData.result.value.name !== 'LocoKwokka' || viewerData.result.value.presets === 0) {
            console.error("❌ Viewer portal deep-link failed:", viewerData.result.value);
            failures++;
        } else {
            console.log(`✅ Viewer portal deep-link resolved streamer "@${viewerData.result.value.name}" with ${viewerData.result.value.presets} price presets`);
        }
        tabViewer.ws.close();

        // -------------------------------------------------------------
        // DEEP-LINK TEST 2: Escrow Claim Deep-linking (?claim=...)
        // -------------------------------------------------------------
        console.log("\n[2.2] Testing Escrow Bounty Claim Deep-linking on Landing (?claim=...)");
        const tabLanding = await connectTab('http://localhost:3000/index.html?claim=bounty_tok_999&amount=50.00');
        await new Promise(r => setTimeout(r, 1000));

        const claimCard = await tabLanding.send('Runtime.evaluate', {
            expression: `(() => {
                const card = document.getElementById('escrow-landing-card');
                return {
                    visible: card ? !card.classList.contains('hidden') : false,
                    title: document.getElementById('escrow-landing-title')?.innerText || ''
                };
            })()`,
            returnByValue: true
        });

        if (!claimCard.result.value.visible) {
            console.error("❌ Escrow landing bounty card failed to unhide on ?claim= URL");
            failures++;
        } else {
            console.log(`✅ Escrow landing bounty card successfully activated via URL parameter`);
        }

        const shotLanding = await tabLanding.send('Page.captureScreenshot', { format: 'png' });
        if (shotLanding && shotLanding.data) {
            const claimPath = path.join(ARTIFACT_DIR, 'verify_claim_bounty_deeplink.png');
            fs.writeFileSync(claimPath, Buffer.from(shotLanding.data, 'base64'));
            console.log(`📸 Saved screenshot to: ${claimPath}`);
        }
        tabLanding.ws.close();

        // -------------------------------------------------------------
        // TEST 3: Observer Mode Security Gateway
        // -------------------------------------------------------------
        console.log("\n[2.3] Testing Observer Mode Security Gate (Unauthorized Mutation Trap)...");
        const tabDash = await connectTab('http://localhost:3000/dashboard.html');
        await new Promise(r => setTimeout(r, 1200));

        // Attempt unauthorized action in Observer Mode
        await tabDash.send('Runtime.evaluate', {
            expression: `(() => {
                // Trigger savePayoutLink in demo/observer mode
                if (typeof window.savePayoutLink === 'function') {
                    window.savePayoutLink();
                } else {
                    const btn = document.querySelector('button[onclick*=\"savePayoutLink\"]');
                    if (btn) btn.click();
                }
            })()`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 400));

        const observerModalState = await tabDash.send('Runtime.evaluate', {
            expression: `(() => {
                const modal = document.getElementById('observer-modal');
                return {
                    isOpen: modal ? !modal.classList.contains('hidden') : false,
                    title: modal ? modal.querySelector('h3')?.innerText : ''
                };
            })()`,
            returnByValue: true
        });

        if (!observerModalState.result.value.isOpen) {
            console.error("❌ Observer modal failed to guard unauthorized mutation:", observerModalState.result.value);
            failures++;
        } else {
            console.log(`✅ Observer mode successfully intercepted unauthorized settings write and displayed "#observer-modal"`);
        }

        const shotObserver = await tabDash.send('Page.captureScreenshot', { format: 'png' });
        if (shotObserver && shotObserver.data) {
            const obsPath = path.join(ARTIFACT_DIR, 'verify_observer_mode_security.png');
            fs.writeFileSync(obsPath, Buffer.from(shotObserver.data, 'base64'));
            console.log(`📸 Saved screenshot to: ${obsPath}`);
        }
        tabDash.ws.close();

    } catch (e) {
        console.error("❌ Chrome CDP Test encountered an error:", e);
        failures++;
    } finally {
        chrome.kill();
    }

    console.log("\n==================================================");
    if (failures === 0) {
        console.log("🎯 ALL PILLAR 7 SYSTEM INTEGRITY AUDITS PASSED WITH ZERO FAILURES!");
        console.log("==================================================");
        process.exit(0);
    } else {
        console.error(`🚨 PILLAR 7 FAILED WITH ${failures} ERRORS.`);
        console.log("==================================================");
        process.exit(1);
    }
}

runSystemIntegrityVerification();
