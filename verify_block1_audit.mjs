import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  console.log("🚀 Starting Headless Chrome for Block 1 Audit Verification...");
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9255/json/version');
      wsUrl = (await res.json()).webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome CDP");
    chrome.kill();
    process.exit(1);
  }

  // TEST 1: Viewer Portal Dynamic Floor & VIP Whale Alert
  console.log("--- TEST 1: Viewer Portal Pricing Floor, VIP & Mascot Protection ---");
  const targetViewer = await (await fetch('http://127.0.0.1:9255/json/new?http://localhost:3000/viewer.html?streamer=LocoKwokka', { method: 'PUT' })).json();
  const wsViewer = new WebSocket(targetViewer.webSocketDebuggerUrl);

  let id = 1;
  const sendV = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === msgId) {
        wsViewer.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    wsViewer.addEventListener('message', handler);
    wsViewer.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => wsViewer.onopen = r);
  await sendV('Page.enable');
  await sendV('DOM.enable');
  await sendV('Runtime.enable');
  await sendV('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 2, mobile: true });

  await new Promise(r => setTimeout(r, 1500));

  // 1. Check dynamic pricing presets & floor
  const floorCheck = await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const minLabel = document.getElementById('min-price-label')?.innerText;
        const amountVal = document.getElementById('amount-input')?.value;
        const presets = Array.from(document.querySelectorAll('.preset-btn')).map(b => b.innerText.replace(/\\n/g, ' '));
        return { minLabel, amountVal, presets };
      })()
    `,
    returnByValue: true
  });
  console.log("Floor & Presets Check:", floorCheck.result.value);

  // 2. Test below-minimum exploit ($0.50)
  console.log("Testing amount below floor ($0.50)...");
  await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const inp = document.getElementById('amount-input');
        inp.value = "0.50";
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `
  });
  await new Promise(r => setTimeout(r, 300));

  const belowMinCheck = await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('submit-btn');
        const btnText = document.getElementById('submit-btn-text')?.innerText;
        const disabled = btn?.disabled;
        const hasRedBorder = document.getElementById('amount-input')?.classList.contains('border-red-500/70');
        return { btnText, disabled, hasRedBorder };
      })()
    `,
    returnByValue: true
  });
  console.log("Below Minimum Check ($0.50):", belowMinCheck.result.value);

  // Capture screenshot of below min state
  const shotBelowMin = await sendV('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/verify_viewer_below_min.png', Buffer.from(shotBelowMin.data, 'base64'));

  // 3. Test VIP Whale amount ($50.00)
  console.log("Testing VIP Whale tier ($50.00)...");
  await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const inp = document.getElementById('amount-input');
        inp.value = "50.00";
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `
  });
  await new Promise(r => setTimeout(r, 300));

  const vipCheck = await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const btnText = document.getElementById('submit-btn-text')?.innerText;
        const bannerVisible = !document.getElementById('whale-vip-dopamine-banner')?.classList.contains('hidden');
        return { btnText, bannerVisible };
      })()
    `,
    returnByValue: true
  });
  console.log("VIP Whale Check ($50.00):", vipCheck.result.value);

  // Capture screenshot of VIP Whale tier
  const shotVip = await sendV('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/verify_viewer_vip_tier.png', Buffer.from(shotVip.data, 'base64'));

  // 4. Test Mascot Donation Protection (Clicking Send for Loco Kwokka)
  console.log("Testing Loco Kwokka Mascot Protection modal trigger...");
  await sendV('Runtime.evaluate', {
    expression: `document.getElementById('submit-btn').click();`
  });
  await new Promise(r => setTimeout(r, 600));

  const mascotModalCheck = await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.getElementById('loco-mascot-modal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const modalText = modal?.innerText;
        return { isVisible, hasStreetQuote: modalText?.includes('way too rich and famous') };
      })()
    `,
    returnByValue: true
  });
  console.log("Loco Mascot Modal Check:", mascotModalCheck.result.value);

  const shotMascot = await sendV('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/verify_viewer_mascot_protection.png', Buffer.from(shotMascot.data, 'base64'));

  // Close mascot modal
  await sendV('Runtime.evaluate', { expression: `window.closeLocoMascotModal();` });
  await new Promise(r => setTimeout(r, 400));

  // 5. Test Banned Device UI
  console.log("Testing Banned Device State in Viewer...");
  await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const localBans = [localStorage.getItem('whutcha_device_id')];
        localStorage.setItem('whutcha_local_banned_devices', JSON.stringify(localBans));
        location.reload();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const bannedCheck = await sendV('Runtime.evaluate', {
    expression: `
      (() => {
        const bannerVisible = !document.getElementById('viewer-banned-banner')?.classList.contains('hidden');
        const btnDisabled = document.getElementById('submit-btn')?.disabled;
        const btnText = document.getElementById('submit-btn-text')?.innerText;
        return { bannerVisible, btnDisabled, btnText };
      })()
    `,
    returnByValue: true
  });
  console.log("Banned Device Check:", bannedCheck.result.value);

  const shotBanned = await sendV('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/verify_viewer_banned_shield.png', Buffer.from(shotBanned.data, 'base64'));

  // Clean local ban
  await sendV('Runtime.evaluate', { expression: `localStorage.removeItem('whutcha_local_banned_devices');` });
  wsViewer.close();

  // TEST 2: Dashboard Cockpit Queue & Anti-Ban Protection
  console.log("\n--- TEST 2: Dashboard Cockpit Queue, Priority & Anti-Ban ---");
  const targetDash = await (await fetch('http://127.0.0.1:9255/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
  const wsDash = new WebSocket(targetDash.webSocketDebuggerUrl);

  let idD = 1;
  const sendD = (method, params = {}) => new Promise((resolve) => {
    const msgId = idD++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === msgId) {
        wsDash.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    wsDash.addEventListener('message', handler);
    wsDash.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => wsDash.onopen = r);
  await sendD('Page.enable');
  await sendD('DOM.enable');
  await sendD('Runtime.enable');
  await sendD('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });

  await new Promise(r => setTimeout(r, 1500));

  // Spawn Sample Video and Sample VIP Whale Donation
  console.log("Spawning Sample Video and Testing Priority Queue...");
  await sendD('Runtime.evaluate', {
    expression: `
      (() => {
        // Trigger Sample Video
        if (typeof window.triggerSampleVideo === 'function') {
          window.triggerSampleVideo();
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // Test VIP whale chime synthesis
  console.log("Testing playSynthesizedChime(true)...");
  const chimeRes = await sendD('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          window.playSynthesizedChime(true);
          return { success: true };
        } catch(e) {
          return { success: false, error: e.message };
        }
      })()
    `,
    returnByValue: true
  });
  console.log("VIP Chime Audio Synthesis:", chimeRes.result.value);

  // Test Loco Mascot Anti-Ban modal
  console.log("Testing Loco Mascot Anti-Ban protection in Cockpit...");
  await sendD('Runtime.evaluate', {
    expression: `
      (() => {
        window.banViewer('dev_loco_123', 'Loco Kwokka');
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const antibanModalCheck = await sendD('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.getElementById('loco-antiban-modal');
        const isVisible = modal && !modal.classList.contains('hidden');
        const text = modal?.innerText;
        return { isVisible, hasStreetsDialogue: text?.includes("streets ain't having it") };
      })()
    `,
    returnByValue: true
  });
  console.log("Dashboard Anti-Ban Mascot Modal:", antibanModalCheck.result.value);

  const shotDashAntiban = await sendD('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/verify_dashboard_loco_antiban.png', Buffer.from(shotDashAntiban.data, 'base64'));

  // Close antiban modal
  await sendD('Runtime.evaluate', { expression: `closeModal('loco-antiban-modal');` });
  await new Promise(r => setTimeout(r, 300));

  // Capture final dashboard view
  const shotDashFinal = await sendD('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/verify_dashboard_block1_final.png', Buffer.from(shotDashFinal.data, 'base64'));

  wsDash.close();
  chrome.kill();
  console.log("✅ All Block 1 Audit tests completed successfully!");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
