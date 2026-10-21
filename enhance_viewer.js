const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Streamer Name (Header)
// Currently: <h1 class="text-2xl font-black text-white leading-tight" id="streamer-name">Streamer</h1>
html = html.replace(/<h1 class="text-2xl font-black text-white leading-tight" id="streamer-name">/,
'<h1 class="text-3xl font-black bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent leading-tight drop-shadow-lg uppercase tracking-widest" id="streamer-name">');

// Subtext: Send a video...
html = html.replace(/<p class="text-silver text-sm font-bold">Send a video message directly to the live stream\.<\/p>/,
'<p class="text-[#00f0ff] text-xs font-black uppercase tracking-widest mt-1 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">Interact Live</p>');

// 2. Tabs
// Video Tab active
html = html.replace(/id="tab-video" class="flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 text-white hover:text-white"/,
'id="tab-video" class="flex-1 py-3 text-xs font-black rounded-xl transition-all relative z-10 text-white hover:text-white uppercase tracking-widest"');
html = html.replace(/id="tab-costream" class="flex-1 py-3 text-sm font-bold rounded-xl text-silver transition-all relative z-10 hover:text-white"/,
'id="tab-costream" class="flex-1 py-3 text-xs font-black rounded-xl text-gray-500 transition-all relative z-10 hover:text-white uppercase tracking-widest"');

// 3. Form fields typography
html = html.replace(/<label class="block text-xs font-black text-silver mb-2 uppercase tracking-wide">/g,
'<label class="block text-[10px] font-black text-[#9d00ff] mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(157,0,255,0.3)]">');

html = html.replace(/<label class="block text-xs font-black text-silver mb-3 uppercase tracking-wide">/g,
'<label class="block text-[10px] font-black text-[#9d00ff] mb-3 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(157,0,255,0.3)]">');

// 4. Record button
html = html.replace(/id="btn-record" class="w-full py-4 bg-white text-black rounded-2xl font-black text-lg transition-all shadow-\[0_0_20px_rgba\(255,255,255,0\.2\)\] hover:scale-\[1\.02\] active:scale-95 flex items-center justify-center gap-2"/,
'id="btn-record" class="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-black text-sm transition-all shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"');

// "Pay & Send" button
html = html.replace(/id="btn-pay-send" class="w-full py-4 bg-primary text-black rounded-2xl font-black text-lg transition-all shadow-\[0_0_20px_rgba\(0,240,255,0\.4\)\] hover:scale-\[1\.02\] active:scale-95"/,
'id="btn-pay-send" class="w-full py-4 bg-gradient-to-r from-[#00f0ff] to-blue-500 text-black rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-[1.02] active:scale-95 uppercase tracking-widest"');

// Retake button
html = html.replace(/id="btn-retake" class="w-full py-4 bg-surface text-silver border border-white\/10 rounded-2xl font-black text-lg transition-all hover:bg-white\/5 hover:text-white"/,
'id="btn-retake" class="w-full py-4 bg-transparent text-gray-400 border border-white/10 rounded-2xl font-black text-sm transition-all hover:bg-white/5 hover:text-white uppercase tracking-widest"');

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Enhanced viewer.html typography and colors');
