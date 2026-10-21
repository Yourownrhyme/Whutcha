const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// "Streamer Hub" -> Premium gradient
html = html.replace(/<h2 class="text-2xl font-black text-white mb-2">Streamer Hub<\/h2>/,
'<h2 class="text-3xl font-black bg-gradient-to-r from-[#00f0ff] to-[#9D00FF] bg-clip-text text-transparent mb-1 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">Streamer Hub</h2>');

// Subtext
html = html.replace(/<p class="text-sm text-gray-500 font-medium mb-8">Access your dashboard and queues\.<\/p>/,
'<p class="text-xs text-gray-400 font-bold mb-8 uppercase tracking-widest">Access your dashboard and queues.</p>');

// Inputs: add focus glow
html = html.replace(/class="w-full bg-\[#111113\] border border-white\/5 focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl px-5 py-4 text-white text-sm font-medium transition-all outline-none placeholder-gray-600"/g,
'class="w-full bg-[#111113] border border-white/5 focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/50 rounded-2xl px-5 py-4 text-white text-sm font-bold transition-all outline-none placeholder-gray-700 shadow-inner"');

// Sign In button: vibrant
html = html.replace(/id="btn-email-signin" type="button" class="w-full py-4 rounded-2xl font-black text-sm bg-white text-black hover:bg-gray-200 hover:scale-\[1\.02\] active:scale-95 transition-all shadow-\[0_0_20px_rgba\(255,255,255,0\.1\)\]"/,
'id="btn-email-signin" type="button" class="w-full py-4 rounded-2xl font-black text-sm bg-[#00f0ff] text-black hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(0,240,255,0.5)] uppercase tracking-widest"');

// Register button: vibrant border
html = html.replace(/id="btn-email-signup" type="button" class="w-full py-4 rounded-2xl font-black text-sm bg-\[#111113\] text-white border border-white\/10 hover:bg-white\/5 hover:scale-\[1\.02\] active:scale-95 transition-all"/,
'id="btn-email-signup" type="button" class="w-full py-4 rounded-2xl font-black text-sm bg-transparent text-[#00f0ff] border-2 border-[#00f0ff]/30 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"');

// Forgot Password
html = html.replace(/class="text-xs text-gray-500 hover:text-primary transition-colors font-bold tracking-wide"/,
'class="text-[10px] text-gray-500 hover:text-[#00f0ff] transition-colors font-black tracking-widest uppercase"');

// "Or connect with"
html = html.replace(/<span class="relative bg-\[#0A0A0B\] px-4 text-xs font-bold text-gray-600 tracking-widest uppercase">Or connect with<\/span>/,
'<span class="relative bg-[#0A0A0B] px-4 text-[10px] font-black text-[#9d00ff] tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(157,0,255,0.5)]">Authenticate Via</span>');

fs.writeFileSync('whutcha-web/index.html', html);
console.log('Enhanced index.html typography and colors');
