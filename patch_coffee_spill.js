const fs = require('fs');

let appjs = fs.readFileSync('whutcha-web/app.js', 'utf8');

const coffeeSpillLogic = `
// ==========================================
// COFFEE SPILL MODE (FATAL ERROR BOUNDARY)
// ==========================================
window.showFatalError = function(errorMsg = "Unknown System Anomaly") {
    if (document.getElementById('fatal-error-screen')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fatal-error-screen';
    overlay.className = 'fixed inset-0 z-[10000] bg-dark flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl';
    
    overlay.innerHTML = \`
        <div class="max-w-md w-full glass-card border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-widest">System Offline</h2>
            <p class="text-silver text-sm mb-6 font-bold">A catastrophic failure occurred. Connection to the neural net was severed.</p>
            <div class="bg-black/50 p-4 rounded-xl text-left mb-8 overflow-hidden border border-white/5 max-h-32 overflow-y-auto">
                <code class="text-[10px] text-red-400 font-mono break-words">\${errorMsg}</code>
            </div>
            <button onclick="window.location.reload()" class="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                REBOOT SYSTEM
            </button>
        </div>
    \`;
    
    document.body.appendChild(overlay);
};

window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || event.reason || "Unhandled Promise Rejection";
    const msgStr = msg.toString();
    // Ignore minor/expected background errors
    if (msgStr.includes('AbortError') || msgStr.includes('realtime') || msgStr.includes('fetch')) return;
    
    console.error('FATAL PROMISE REJECTION:', event.reason);
    showFatalError(msgStr);
});

window.addEventListener('error', (event) => {
    const msgStr = event.message || "";
    // Ignore non-fatal browser quirks
    if (msgStr.includes('ResizeObserver') || msgStr.includes('Script error')) return;
    
    console.error('FATAL JS ERROR:', event.error);
    showFatalError(msgStr);
});
`;

if (!appjs.includes('COFFEE SPILL MODE')) {
    appjs += '\n\n' + coffeeSpillLogic;
    fs.writeFileSync('whutcha-web/app.js', appjs);
    console.log('app.js patched for Coffee Spill mode.');
} else {
    console.log('Already patched.');
}
