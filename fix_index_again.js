const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// 1. Delete the entire onboarding block
html = html.replace(/<div id="onboarding"[\s\S]*?<!-- AUTH SCREEN -->/, '<!-- AUTH SCREEN -->');

// 2. Make auth-screen visible by default
html = html.replace(/<div id="auth-screen" class="absolute inset-0 z-10 opacity-0 pointer-events-none transition-opacity duration-700 flex flex-col md:flex-row overflow-hidden bg-\[#050505\]">/, 
'<div id="auth-screen" class="absolute inset-0 z-10 flex flex-col md:flex-row overflow-hidden bg-[#050505]">');

// 3. Change REDEFINE LIVE to WHUTCHA
html = html.replace(/<span class="text-white">REDEFINE<\/span><br>\s*<span class="bg-gradient-to-r from-primary via-\[#00f0ff\] to-\[#9D00FF\] bg-clip-text text-transparent">LIVE\.<\/span>/,
`<span class="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">WHUT</span><br>
                <span class="bg-gradient-to-r from-primary via-[#00f0ff] to-[#9D00FF] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]">CHA.</span>`);

// 4. Fix Form submission preventing reload
html = html.replace('<form id="auth-form"', '<div id="auth-form"');
html = html.replace('</form>', '</div>');

// 5. Fix Login/Register button IDs so app.js binds them correctly
html = html.replace('id="btn-login"', 'id="btn-email-signin" type="button"');
html = html.replace('id="btn-register"', 'id="btn-email-signup" type="button"');

// 6. Upgrade the OAuth Buttons (Pop colors instead of boring gray)
const oldGoogle = /<button onclick="window\.signInOAuth\('google'\)".*?<\/button>/s;
const newGoogle = `<button onclick="window.signInOAuth('google')" class="w-full py-3.5 bg-white hover:bg-gray-200 text-black rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/></svg>
                    <span>Continue with Google</span>
                </button>`;
html = html.replace(oldGoogle, newGoogle);

const oldTwitch = /<button onclick="window\.signInOAuth\('twitch'\)".*?<\/button>/s;
const newTwitch = `<button onclick="window.signInOAuth('twitch')" class="w-full py-3.5 bg-[#9146FF] hover:bg-[#a970ff] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(145,70,255,0.4)]">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                        <span>Twitch</span>
                    </button>`;
html = html.replace(oldTwitch, newTwitch);

const oldDiscord = /<button onclick="window\.signInOAuth\('discord'\)".*?<\/button>/s;
const newDiscord = `<button onclick="window.signInOAuth('discord')" class="w-full py-3.5 bg-[#5865F2] hover:bg-[#7289da] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(88,101,242,0.4)]">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                        <span>Discord</span>
                    </button>`;
html = html.replace(oldDiscord, newDiscord);

const oldApple = /<button onclick="window\.signInOAuth\('apple'\)".*?<\/button>/s;
const newApple = `<button onclick="window.signInOAuth('apple')" class="w-full py-3.5 bg-white hover:bg-gray-200 text-black rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        <svg class="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" display="none"/><path d="M17.05 13.92c-.032-2.732 2.246-4.062 2.348-4.123-1.272-1.85-3.238-2.103-3.94-2.138-1.684-.173-3.284.992-4.152.992-.868 0-2.19-.968-3.585-.94-1.81.025-3.486 1.052-4.42 2.678-1.895 3.283-.485 8.143 1.353 10.803.903 1.298 1.956 2.76 3.376 2.713 1.365-.05 1.884-.878 3.447-.878 1.563 0 2.036.878 3.473.85 1.463-.028 2.378-1.328 3.255-2.608 1.018-1.488 1.442-2.928 1.464-3.003-.032-.015-2.822-1.082-2.855-3.84m-2.42-6.52c.745-.905 1.247-2.163 1.11-3.415-1.07.043-2.38.713-3.148 1.635-.684.81-1.285 2.1-1.125 3.33 1.198.093 2.42-.643 3.16-1.55z"/></svg>
                        <span>Apple</span>
                    </button>`;
html = html.replace(oldApple, newApple);

const oldFacebook = /<button onclick="window\.signInOAuth\('facebook'\)".*?<\/button>/s;
const newFacebook = `<button onclick="window.signInOAuth('facebook')" class="w-full py-3.5 bg-[#1877F2] hover:bg-[#2d88ff] text-white rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 font-bold text-sm shadow-[0_0_15px_rgba(24,119,242,0.4)]">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span>Facebook</span>
                    </button>`;
html = html.replace(oldFacebook, newFacebook);

fs.writeFileSync('whutcha-web/index.html', html);
console.log('Fixed index.html onboarding removal, form IDs, and OAuth button styles.');
