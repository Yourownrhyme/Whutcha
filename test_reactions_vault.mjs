import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9243',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9243/json/version');
      wsUrl = (await res.json()).webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  const target = await (await fetch('http://127.0.0.1:9243/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
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
  await send('Runtime.enable');
  
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  });

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture sidebar with Reactions Vault button and tooltip
  console.log("Capturing Reactions Vault button in sidebar...");
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tooltips = document.querySelectorAll('.sidebar-tooltip');
      tooltips.forEach(t => t.style.opacity = '0');
      if (tooltips[2]) tooltips[2].style.opacity = '1'; // Reactions Vault tooltip
    })()`
  });
  await new Promise(r => setTimeout(r, 300));
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_vault_sidebar_tooltip.png', Buffer.from(shot.data, 'base64'));

  // 2. Open Reactions Vault modal
  console.log("Opening Reactions Vault modal...");
  const modalInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      openReactionsVault();
      const modal = document.getElementById('reactions-vault-modal');
      const cs = window.getComputedStyle(modal);
      const rect = modal.getBoundingClientRect();
      return JSON.stringify({
        classes: modal.className,
        display: cs.display,
        opacity: cs.opacity,
        zIndex: cs.zIndex,
        rect: rect
      });
    })()`,
    returnByValue: true
  });
  console.log("MODAL COMPUTED INFO:", modalInfo.result.value);
  await new Promise(r => setTimeout(r, 500));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_vault_modal_initial.png', Buffer.from(shot.data, 'base64'));

  // 3. Click Simulate Reaction in Vault
  console.log("Minting simulated reaction clip in Vault...");
  await send('Runtime.evaluate', {
    expression: `(() => {
      simulateReactionInVault();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_vault_modal_minted.png', Buffer.from(shot.data, 'base64'));

  chrome.kill();
  process.exit(0);
}

run().catch(console.error);
