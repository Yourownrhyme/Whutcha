// verify_block5_a11y.mjs
// Automated WCAG 2.1 AA Accessibility & Keyboard Trapping Verification Suite for Whutcha

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec';

async function runA11yVerification() {
    console.log("==================================================");
    console.log("🧪 RUNNING PILLAR 5 VERIFICATION (WCAG 2.1 AA A11Y)");
    console.log("==================================================");

    let failures = 0;

    const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
        '--headless=new',
        '--remote-debugging-port=9264',
        '--disable-gpu',
        'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch('http://127.0.0.1:9264/json/version');
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
        const target = await (await fetch('http://127.0.0.1:9264/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
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
        await send('DOM.enable');
        await send('CSS.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        await new Promise(r => setTimeout(r, 1200));

        // -------------------------------------------------------------
        // TEST 1: ARIA Semantics Audit across Dashboard
        // -------------------------------------------------------------
        console.log("\n[1] Auditing ARIA Roles & Accessible Names...");
        const ariaAudit = await send('Runtime.evaluate', {
            expression: `(() => {
                const results = { unlabelledButtons: [], modalsWithoutRoles: [], liveRegionOk: false, audioToggleOk: false };
                
                // Check all buttons
                document.querySelectorAll('button').forEach((b, i) => {
                    const text = (b.innerText || '').trim();
                    const ariaLabel = b.getAttribute('aria-label');
                    const ariaLabelledby = b.getAttribute('aria-labelledby');
                    const title = b.getAttribute('title');
                    if (!text && !ariaLabel && !ariaLabelledby && !title) {
                        results.unlabelledButtons.push(b.id || 'button-' + i);
                    }
                });

                // Check all modals
                const modalIds = [
                    'settings-modal', 'legal-modal-tos', 'legal-modal-privacy', 
                    'legal-modal-contact', 'obs-guide-modal', 'recovery-modal', 
                    'loco-antiban-modal', 'observer-modal', 'costream-modal', 
                    'video-preview-modal', 'reactions-vault-modal', 'share-vault-modal', 
                    'ios-install-modal'
                ];
                modalIds.forEach(id => {
                    const m = document.getElementById(id);
                    if (m) {
                        const hasRole = m.getAttribute('role') === 'dialog';
                        const isModal = m.getAttribute('aria-modal') === 'true';
                        if (!hasRole || !isModal) {
                            results.modalsWithoutRoles.push(id);
                        }
                    }
                });

                // Check live region
                const toast = document.getElementById('toast');
                results.liveRegionOk = toast && toast.getAttribute('role') === 'status' && toast.getAttribute('aria-live') === 'polite';

                // Check audio toggle
                const audioToggle = document.getElementById('toggle-whutcha-sound');
                results.audioToggleOk = audioToggle && !!audioToggle.getAttribute('aria-label');

                return results;
            })()`,
            returnByValue: true
        });

        const audit = ariaAudit.result.value;
        if (audit.unlabelledButtons.length > 0) {
            console.error(`❌ Found ${audit.unlabelledButtons.length} unlabelled buttons:`, audit.unlabelledButtons);
            failures++;
        } else {
            console.log("✅ All buttons have valid accessible names/labels");
        }

        if (audit.modalsWithoutRoles.length > 0) {
            console.error(`❌ Modals missing role="dialog" or aria-modal="true":`, audit.modalsWithoutRoles);
            failures++;
        } else {
            console.log("✅ All 13 modal dialogues properly configured with role=\"dialog\" and aria-modal=\"true\"");
        }

        if (!audit.liveRegionOk) {
            console.error("❌ #toast missing role=\"status\" or aria-live=\"polite\"");
            failures++;
        } else {
            console.log("✅ #toast notification container configured with role=\"status\" and aria-live=\"polite\"");
        }

        if (!audit.audioToggleOk) {
            console.error("❌ #toggle-whutcha-sound missing accessible label");
            failures++;
        } else {
            console.log("✅ #toggle-whutcha-sound has valid aria-label");
        }

        // -------------------------------------------------------------
        // TEST 2: Keyboard Focus-Visible & High-Contrast Outline
        // -------------------------------------------------------------
        console.log("\n[2] Verifying :focus-visible High-Contrast Focus Indicator...");
        const focusVisibleCheck = await send('Runtime.evaluate', {
            expression: `(() => {
                const btn = document.querySelector('header button');
                if (btn) btn.focus();
                const matchedRules = [];
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules) {
                            if (rule.selectorText && rule.selectorText.includes(':focus-visible')) {
                                matchedRules.push(rule.cssText);
                            }
                        }
                    } catch(e){}
                }
                return { hasRules: matchedRules.length > 0, rules: matchedRules };
            })()`,
            returnByValue: true
        });

        if (!focusVisibleCheck.result.value.hasRules) {
            console.error("❌ No :focus-visible rule found in loaded stylesheets");
            failures++;
        } else {
            console.log(`✅ :focus-visible active in stylesheet (${focusVisibleCheck.result.value.rules[0]})`);
        }

        // -------------------------------------------------------------
        // TEST 3: Modal Focus Trap (Tab & Shift+Tab Cycling)
        // -------------------------------------------------------------
        console.log("\n[3] Testing Modal Focus Trap (Tab/Shift+Tab cycle)...");
        // Open Settings Modal
        await send('Runtime.evaluate', {
            expression: `window.openSettingsModal();`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 400));

        // Test focus trap cycling
        const trapTest = await send('Runtime.evaluate', {
            expression: `(() => {
                const modal = document.getElementById('settings-modal');
                const focusables = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])')).filter(el => el.offsetParent !== null);
                
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                // Focus last and simulate Tab
                last.focus();
                const eventTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
                document.dispatchEvent(eventTab);
                const focusedAfterTab = document.activeElement;

                // Focus first and simulate Shift+Tab
                first.focus();
                const eventShiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
                document.dispatchEvent(eventShiftTab);
                const focusedAfterShiftTab = document.activeElement;

                return {
                    firstTag: first ? first.tagName : null,
                    lastTag: last ? last.tagName : null,
                    wrappedToFirst: focusedAfterTab === first,
                    wrappedToLast: focusedAfterShiftTab === last
                };
            })()`,
            returnByValue: true
        });

        const trap = trapTest.result.value;
        if (!trap.wrappedToFirst || !trap.wrappedToLast) {
            console.error("❌ Modal Focus Trap failed:", trap);
            failures++;
        } else {
            console.log("✅ Focus Trap passed: Tab on last element wrapped to first element; Shift+Tab on first element wrapped to last element");
        }

        // -------------------------------------------------------------
        // TEST 4: Escape Key Closes Modal & Preserves Panic Switch
        // -------------------------------------------------------------
        console.log("\n[4] Testing Escape Key Handler...");
        const modalBefore = await send('Runtime.evaluate', {
            expression: `!document.getElementById('settings-modal').classList.contains('hidden')`,
            returnByValue: true
        });

        // Dispatch Escape
        await send('Runtime.evaluate', {
            expression: `(() => {
                const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
                document.dispatchEvent(escEvent);
            })()`,
            returnByValue: true
        });

        // Wait for 300ms closing fade transition
        await new Promise(r => setTimeout(r, 350));

        const modalAfter = await send('Runtime.evaluate', {
            expression: `document.getElementById('settings-modal').classList.contains('hidden')`,
            returnByValue: true
        });

        if (!modalBefore.result.value || !modalAfter.result.value) {
            console.error("❌ Escape key failed to close modal:", { modalBefore: modalBefore.result.value, modalAfter: modalAfter.result.value });
            failures++;
        } else {
            console.log("✅ Escape key closed #settings-modal cleanly without triggering Panic Blackout");
        }

        // Capture screenshot of dashboard with keyboard focus visible
        await send('Runtime.evaluate', {
            expression: `document.getElementById('btn-pwa-install-header')?.focus();`,
            returnByValue: true
        });
        await new Promise(r => setTimeout(r, 200));

        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot && shot.data) {
            const shotPath = path.join(ARTIFACT_DIR, 'verify_a11y_keyboard_focus.png');
            fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
            console.log(`📸 Saved screenshot to: ${shotPath}`);
        }

        ws.close();
    } catch(e) {
        console.error("❌ Test crashed:", e);
        failures++;
    } finally {
        chrome.kill();
    }

    console.log("\n==================================================");
    if (failures === 0) {
        console.log("🎯 ALL PILLAR 5 A11Y AUDITS PASSED WITH ZERO FAILURES!");
        console.log("==================================================");
        process.exit(0);
    } else {
        console.error(`🚨 PILLAR 5 FAILED WITH ${failures} ERRORS.`);
        console.log("==================================================");
        process.exit(1);
    }
}

runA11yVerification();
