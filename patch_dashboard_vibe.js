const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Sidebar Logo W bigger
const oldLogo = `<h1 class="text-2xl font-black tracking-tight text-glow">Whutcha</h1>`;
const newLogo = `<h1 class="text-2xl font-black tracking-tight text-glow"><span class="text-4xl text-primary">W</span>hutcha</h1>`;
html = html.replace(oldLogo, newLogo);

// 2. Welcome Back -> Broadcaster Dashboard
const oldHeader = `<h2 class="text-3xl font-black text-white tracking-tight mb-1">Welcome back</h2>`;
const newHeader = `<h2 class="text-4xl font-black bg-gradient-to-r from-white via-white to-silver bg-clip-text text-transparent tracking-tight mb-1">Broadcaster Dashboard</h2>`;
html = html.replace(oldHeader, newHeader);

// 3. Payout Link Text Clarification
const oldPayText1 = `<p class="text-silver text-xs mb-4">Paste your DonationAlerts, Boosty, or PayPal link. Viewers will be sent here after recording a video.</p>`;
const newPayText1 = `<p class="text-silver text-xs mb-4">External Payout Link (DonationAlerts / Boosty / PayPal). <br>Since we don't process payments natively (ZERO fees!), viewers will be redirected here to pay after recording.</p>`;
html = html.replace(oldPayText1, newPayText1);

const oldPayText2 = `<p class="text-[10px] text-gray-400 mt-1">DonationAlerts, PayPal.me, or Ko-fi link. Viewers will be redirected here to pay.</p>`;
const newPayText2 = `<p class="text-[10px] text-gray-400 mt-1">Since we take zero fees, viewers are redirected here to pay you directly.</p>`;
html = html.replace(oldPayText2, newPayText2);

// 4. Tooltip orientation fix in Dashboard
html = html.replace(/bottom-full mb-2/g, 'top-full mt-3');

// 5. Add GDPR button to Settings Modal
const settingsFooter = `<div class="pt-6 border-t border-white/10 flex justify-end gap-3 mt-4">`;
const gdprBtn = `<button onclick="if(confirm('Are you sure you want to delete your account? This action is irreversible.')) { alert('Data deletion requested. Contacting support.'); }" class="px-6 py-3 rounded-xl font-bold text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors mr-auto">Delete Account (GDPR)</button>\n                `;
html = html.replace(settingsFooter, settingsFooter + gdprBtn);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Dashboard UI updated.');
