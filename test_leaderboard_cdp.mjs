import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9246',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9246/json/version');
      wsUrl = (await res.json()).webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  if (!wsUrl) {
    console.error("Failed to connect to headless Chrome");
    chrome.kill();
    process.exit(1);
  }

  const target = await (await fetch('http://127.0.0.1:9246/json/new?http://localhost:3000/leaderboard.html', { method: 'PUT' })).json();
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
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails);
    }
  });

  // Set Desktop viewport 1280x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Desktop View
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_leaderboard_desktop.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved scratch_leaderboard_desktop.png');

  // Search Test: Type "Tekken" into search bar
  await send('Runtime.evaluate', {
    expression: `
      const input = document.getElementById('leaderboard-search');
      input.value = 'Tekken';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // Screenshot 2: Filtered Search View
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_leaderboard_search.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved scratch_leaderboard_search.png');

  // Reset Search
  await send('Runtime.evaluate', {
    expression: `window.resetAllFilters();`
  });
  await new Promise(r => setTimeout(r, 300));

  // Set Mobile viewport 390x844 (iPhone 14 / Frankenstein Mode test)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 500));

  // Screenshot 3: Mobile View
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/jack/.gemini/antigravity/brain/7d51e877-94e2-433b-85e7-7f492fb444ec/scratch_leaderboard_mobile.png', Buffer.from(snap3.data, 'base64'));
  console.log('Saved scratch_leaderboard_mobile.png');

  ws.close();
  chrome.kill();
  console.log('Leaderboard QA test completed successfully!');
}

run().catch(console.error);
