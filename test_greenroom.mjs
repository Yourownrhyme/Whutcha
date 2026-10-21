import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9241/json/version');
      wsUrl = (await res.json()).webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  const target = await (await fetch('http://127.0.0.1:9241/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1050, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Scroll main to Queue section and capture Panic Killswitch Tooltip
  console.log("Testing Panic Kill Switch tooltip...");
  await send('Runtime.evaluate', { expression: 'document.querySelector("main").scrollTop = 800' });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-obs-killswitch');
      const tooltip = btn.nextElementSibling;
      if (tooltip) {
        tooltip.style.opacity = '1';
        tooltip.style.pointerEvents = 'auto';
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_killswitch_tooltip.png', Buffer.from(shot.data, 'base64'));
  console.log("Saved scratch_killswitch_tooltip.png");

  // 2. Open Director Green Room in Standby
  console.log("Opening Director Green Room Console in Standby...");
  await send('Runtime.evaluate', { expression: 'window.openCoStreamStudio()' });
  await new Promise(r => setTimeout(r, 600));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_greenroom_standby.png', Buffer.from(shot.data, 'base64'));
  console.log("Saved scratch_greenroom_standby.png");

  // Close standby modal
  await send('Runtime.evaluate', { expression: 'window.closeCoStreamModal()' });
  await new Promise(r => setTimeout(r, 400));

  // 3. Inject Co-Stream simulation into queue
  console.log("Injecting Loco Kwokka Co-Stream Call into Queue...");
  await send('Runtime.evaluate', { expression: 'simulateDonation("costream")' });
  await new Promise(r => setTimeout(r, 600));

  // 4. Click Approve button on the Co-Stream card
  console.log("Clicking Approve on Co-Stream card...");
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[onclick*="approveDonation"]');
      if (btn) {
        console.log("Found approve button:", btn.innerText);
        btn.click();
      } else {
        console.warn("Approve button not found in DOM!");
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_greenroom_active_call.png', Buffer.from(shot.data, 'base64'));
  console.log("Saved scratch_greenroom_active_call.png");

  // 5. Test Push to OBS Live
  console.log("Testing Push to OBS Live...");
  await send('Runtime.evaluate', { expression: 'window.pushActiveCallToObs()' });
  await new Promise(r => setTimeout(r, 500));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_greenroom_pushed_obs.png', Buffer.from(shot.data, 'base64'));
  console.log("Saved scratch_greenroom_pushed_obs.png");

  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
