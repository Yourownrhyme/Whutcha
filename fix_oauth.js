const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const oldOAuthBlockRegex = /<!-- OAuth Buttons \(2026 Clean Style\) -->[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/;

const newOAuthBlock = `<!-- OAuth Buttons (2026 Clean Style) -->
            <div class="space-y-3">
                <!-- Google -->
                <button onclick="window.signInOAuth('google')" class="w-full py-3.5 bg-white hover:bg-gray-200 text-black rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/></svg>
                    <span>Continue with Google</span>
                </button>
                
                <div class="grid grid-cols-2 gap-3">
                    <!-- Twitch -->
                    <button onclick="window.signInOAuth('twitch')" class="w-full py-3 bg-[#9146FF] hover:bg-[#a970ff] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(145,70,255,0.4)]">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                        <span>Twitch</span>
                    </button>
                    <!-- Discord -->
                    <button onclick="window.signInOAuth('discord')" class="w-full py-3 bg-[#5865F2] hover:bg-[#7289da] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(88,101,242,0.4)]">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                        <span>Discord</span>
                    </button>
                    <!-- Facebook -->
                    <button onclick="window.signInOAuth('facebook')" class="w-full py-3 bg-[#1877F2] hover:bg-[#2d88ff] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(24,119,242,0.4)]">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span>Facebook</span>
                    </button>
                    <!-- X / Twitter -->
                    <button onclick="window.signInOAuth('twitter')" class="w-full py-3 bg-black hover:bg-gray-900 text-white border border-white/20 rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-xl">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <span>X</span>
                    </button>
                </div>
                <!-- Zoom -->
                <button onclick="window.signInOAuth('zoom')" class="w-full py-3.5 bg-[#0B5CFF] hover:bg-[#3276ff] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(11,92,255,0.4)]">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"></path></svg>
                    <span>Continue with Zoom</span>
                </button>
            </div>`;

if(oldOAuthBlockRegex.test(html)) {
    html = html.replace(oldOAuthBlockRegex, newOAuthBlock);
    fs.writeFileSync('whutcha-web/index.html', html);
    console.log('Successfully updated OAuth buttons');
} else {
    console.log('Regex did not match!');
}
