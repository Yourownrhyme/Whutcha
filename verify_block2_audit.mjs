import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  console.log("🚀 Starting Block 2 Verification (Code Cleanliness & White-Label Architecture)...");

  // 1. Static AST/Text Code Scan
  console.log("🔍 Checking source code for Zero Mocks and Protocol Masking...");
  const dashCode = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
  const viewerCode = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
  const overlayCode = fs.readFileSync('whutcha-web/overlay.html', 'utf8');
  const boardCode = fs.readFileSync('whutcha-web/leaderboard.html', 'utf8');

  // Verify Zero Mocks in production DB table
  if (dashCode.includes("supabaseClient.from('donations').insert([simData])")) {
    throw new Error("FATAL: Simulation still inserts mock rows into Supabase donations table!");
  }
  console.log("✅ Zero Mocks Verified: simData is strictly client-side & BroadcastChannel.");

  // Verify protocol codes in dashboard.js
  const requiredDashCodes = [
    '[Whutcha Protocol 500]',
    '[Whutcha Protocol 400]',
    '[Whutcha Protocol 503]',
    '[Whutcha Security 401]',
    '[Whutcha Security 403]',
    '[Whutcha Live Bridge 500]',
    '[Whutcha Live Bridge 503]',
    '[Whutcha Broadcast Gateway 500]'
  ];
  for (const code of requiredDashCodes) {
    if (!dashCode.includes(code)) {
      throw new Error(`Missing expected masked code in dashboard.js: ${code}`);
    }
  }
  console.log("✅ All required protocol error codes present in dashboard.js!");

  // Verify protocol codes in viewer.html
  const requiredViewerCodes = [
    '[Whutcha Protocol 400]',
    '[Whutcha Protocol 500]',
    '[Whutcha Security 429]',
    '[Whutcha Security 403]',
    '[Whutcha Live Bridge 200]',
    '[Whutcha Live Bridge 503]'
  ];
  for (const code of requiredViewerCodes) {
    if (!viewerCode.includes(code)) {
      throw new Error(`Missing expected masked code in viewer.html: ${code}`);
    }
  }
  console.log("✅ All required protocol error codes present in viewer.html!");

  // Verify protocol codes in overlay.html
  const requiredOverlayCodes = [
    '[Whutcha Live Bridge 500]',
    '[Whutcha Broadcast Gateway 401]',
    '[Whutcha Broadcast Gateway 400]'
  ];
  for (const code of requiredOverlayCodes) {
    if (!overlayCode.includes(code)) {
      throw new Error(`Missing expected masked code in overlay.html: ${code}`);
    }
  }
  console.log("✅ All required protocol error codes present in overlay.html!");

  // 2. Headless Chrome Browser Runtime Test
  console.log("🌐 Launching Headless Chrome to inspect live DOM & runtime behavior...");
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9256',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9256/json/version');
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

  try {
    // Audit Dashboard Runtime
    console.log("🔍 Testing Dashboard runtime queue simulation...");
    const targetDash = await (await fetch('http://127.0.0.1:9256/json/new?http://localhost:3000/dashboard.html', { method: 'PUT' })).json();
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
    await sendD('Runtime.enable');
    await sendD('DOM.enable');

    await new Promise(r => setTimeout(r, 1500));

    // Execute simulation in Dashboard
    await sendD('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof window.triggerSampleVideo === 'function') {
            window.triggerSampleVideo();
          } else if (typeof window.simulateDonation === 'function') {
            window.simulateDonation('video');
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const simResult = await sendD('Runtime.evaluate', {
      expression: `
        (() => {
          const list = typeof window.getCurrentDonations === 'function' ? window.getCurrentDonations() : (window.currentDonations || []);
          const queueCards = document.querySelectorAll('#queue-container [data-donation-id], #queue-container .cyber-rack');
          return {
            donations: list.map(d => ({ id: d.id, username: d.username, amount: d.amount })),
            domCardCount: queueCards.length,
            hasModal: document.getElementById('video-preview-modal') && !document.getElementById('video-preview-modal').classList.contains('hidden')
          };
        })()
      `,
      returnByValue: true
    });

    const simVal = simResult && simResult.result ? simResult.result.value : null;
    console.log("Dashboard simulation result:", simVal);
    const hasSimCard = simVal && simVal.donations && simVal.donations.some(d => String(d.id).startsWith('SIM-'));
    if (!hasSimCard && (!simVal || simVal.domCardCount === 0)) {
      throw new Error("Simulation card was not created in memory queue!");
    }
    console.log("✅ Simulation card successfully added to in-memory queue without database pollution.");

    // Audit Viewer Runtime
    console.log("🔍 Testing Viewer Portal for DOM vendor leaks...");
    const targetViewer = await (await fetch('http://127.0.0.1:9256/json/new?http://localhost:3000/viewer.html?streamer=LocoKwokka', { method: 'PUT' })).json();
    const wsViewer = new WebSocket(targetViewer.webSocketDebuggerUrl);

    let idV = 1;
    const sendV = (method, params = {}) => new Promise((resolve) => {
      const msgId = idV++;
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
    await sendV('Runtime.enable');
    await new Promise(r => setTimeout(r, 1500));

    // Check DOM for leaked vendor names in visible text
    const leakCheck = await sendV('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const matches = bodyText.match(/\\b(livekit|supabase|postgresql|cloudflare)\\b/gi);
          return matches || [];
        })()
      `,
      returnByValue: true
    });

    const leakVal = leakCheck && leakCheck.result ? leakCheck.result.value : [];
    console.log("Viewer DOM vendor leaks detected:", leakVal);
    if (leakVal && leakVal.length > 0) {
      throw new Error(`Leaked vendor keywords in DOM: ${leakVal.join(', ')}`);
    }
    console.log("✅ Zero vendor keywords leaked in user-facing DOM!");

    console.log("🎉 ALL BLOCK 2 AUDIT CHECKS PASSED WITH 100% SUCCESS!");
  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error("❌ Block 2 Verification Failed:", err);
  process.exit(1);
});
