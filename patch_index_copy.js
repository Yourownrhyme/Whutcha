const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// 1. Splash Copy & Styling
html = html.replace('Whutcha</h1>', 'WHUTCHA</h1>');
html = html.replace('text-6xl font-black mb-4 text-white', 'text-7xl font-black mb-6 bg-gradient-to-br from-primary via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]');
html = html.replace('Monetize your live reactions. Let your viewers pay to jump on stream instantly.', 'The first platform for <b>Video-Donations</b> & <b>Instant Co-Streams</b> (even if your platform doesn\'t support them natively).<br><br>Fans pay to send video messages. You record your live reactions. We take <b>ZERO</b> fees and collect <b>ZERO</b> personal data or payment info.');
html = html.replace('text-xl text-silver mb-12 max-w-lg font-medium leading-relaxed', 'text-lg text-silver mb-12 max-w-xl font-medium leading-relaxed');

// 2. Streamer Access
html = html.replace('Streamer Access', 'STREAMER HUB');
html = html.replace('text-3xl font-black text-white mb-2', 'text-3xl font-black bg-gradient-to-r from-white to-silver bg-clip-text text-transparent mb-2 uppercase tracking-widest');

// 3. Auth Providers (Add Twitch and Discord)
const googleBtn = `<button onclick="if(document.getElementById('terms').checked) { login('google') } else { alert('Please agree to the Terms of Use first.') }" class="w-full relative group py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300">
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                        <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                    </svg>
                    <span class="font-bold text-white tracking-wide">Continue with Google</span>
                </button>`;

const newBtns = googleBtn + `
                <button onclick="if(document.getElementById('terms').checked) { login('twitch') } else { alert('Please agree to the Terms of Use first.') }" class="w-full relative group py-4 px-6 bg-[#9146FF]/10 hover:bg-[#9146FF]/20 border border-[#9146FF]/30 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300">
                    <svg class="w-5 h-5 text-[#9146FF]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                    <span class="font-bold text-white tracking-wide">Continue with Twitch</span>
                </button>
                <button onclick="if(document.getElementById('terms').checked) { login('discord') } else { alert('Please agree to the Terms of Use first.') }" class="w-full relative group py-4 px-6 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300">
                    <svg class="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                    <span class="font-bold text-white tracking-wide">Continue with Discord</span>
                </button>
`;
if (html.includes(googleBtn)) {
    html = html.replace(googleBtn, newBtns);
}

fs.writeFileSync('whutcha-web/index.html', html);
console.log('index.html Auth & Copy Patched');
