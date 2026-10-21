const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

// Fix 1: WHUTCHA title and Description
html = html.replace('<h1 class="text-3xl font-black mb-2 tracking-tight text-glow">WHUTCHA</h1>', 
'<h1 class="text-5xl font-black mb-4 tracking-tight text-glow bg-gradient-to-br from-primary via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]"><span class="text-7xl">W</span>HUTCHA</h1>');

html = html.replace('<p class="text-silver text-sm font-bold">Monetize your live reactions. Let your viewers pay to jump on stream instantly.</p>', 
'<p class="text-silver text-[13px] font-bold leading-relaxed max-w-xs mx-auto">The premium platform for <span class="text-white">Video-Donations</span> & <span class="text-white">Instant Co-Streams</span>. We take <span class="text-primary">ZERO fees</span>.</p>');

// Fix 2: Streamer Hub Header
html = html.replace('<h2 class="text-xl font-black mb-6 text-center border-b border-white/10 pb-4">STREAMER HUB</h2>', 
'<h2 class="text-2xl font-black mb-6 text-center border-b border-white/10 pb-4 bg-gradient-to-r from-white to-silver bg-clip-text text-transparent tracking-widest uppercase">Streamer Access</h2>');

// Fix 3: Auth Buttons (Insert Twitch & Discord after Google)
const googleBtnRegex = /<button onclick="if\(document\.getElementById\('terms'\)\.checked\) \{ login\('google'\) \}[\s\S]*?Continue with Google\s*<\/button>/;
const matchGoogle = html.match(googleBtnRegex);
if (matchGoogle) {
    const googleBtnHTML = matchGoogle[0];
    const newBtns = googleBtnHTML + `
            <button onclick="if(document.getElementById('terms').checked) { login('twitch') } else { alert('Please agree to the Terms of Use first.') }" class="w-full relative group py-4 px-6 bg-[#9146FF]/10 hover:bg-[#9146FF]/20 border border-[#9146FF]/30 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 mt-3 shadow-[0_0_15px_rgba(145,70,255,0.1)]">
                <svg class="w-5 h-5 text-[#9146FF]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                <span class="font-bold text-white tracking-wide">Continue with Twitch</span>
            </button>
            <button onclick="if(document.getElementById('terms').checked) { login('discord') } else { alert('Please agree to the Terms of Use first.') }" class="w-full relative group py-4 px-6 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 mt-3 shadow-[0_0_15px_rgba(88,101,242,0.1)]">
                <svg class="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                <span class="font-bold text-white tracking-wide">Continue with Discord</span>
            </button>`;
    html = html.replace(googleBtnHTML, newBtns);
} else {
    console.log("Could not find Google auth button to replace.");
}

// Fix 4: Real Terms of Use and Privacy Policy Modals
const tosHTML = `
                <h3 class="text-2xl font-black mb-6 text-white">Terms of Service</h3>
                <div class="space-y-6 text-sm text-silver font-medium leading-relaxed custom-scrollbar">
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">1. Acceptance of Terms</h4>
                        <p>By accessing Whutcha, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access the platform.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">2. Description of Service</h4>
                        <p>Whutcha is a platform allowing content creators to receive video-donations and co-stream requests. We act solely as an intermediary and do not process native fiat payments directly on our servers.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">3. User Conduct & Content</h4>
                        <p>You are solely responsible for all video, audio, and text you submit. Hate speech, nudity, illegal acts, and harassment are strictly prohibited and will result in an immediate hardware ban.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">4. Zero-Fee Payment Structure</h4>
                        <p>Whutcha does not deduct any percentage from donations. All transactions are routed through third-party processors linked by the streamer (e.g., Stripe, PayPal). The streamer is responsible for all associated taxes and processor fees.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">5. Limitation of Liability</h4>
                        <p>We are not liable for any damages, broadcast bans (e.g., on Twitch/YouTube), or lost revenue resulting from the use of Whutcha. Streamers must actively moderate their queue.</p>
                    </section>
                </div>
`;
html = html.replace(/<h3 class="text-2xl font-black mb-6 text-white">Terms of Use<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<div class="p-6 border-t border-white\/5 bg-black\/20 pointer-events-auto">/, tosHTML + `</div>\n            <div class="p-6 border-t border-white/5 bg-black/20 pointer-events-auto">`);

const privacyHTML = `
                <h3 class="text-2xl font-black mb-6 text-white">Privacy Policy</h3>
                <div class="space-y-6 text-sm text-silver font-medium leading-relaxed custom-scrollbar">
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">1. Minimal Data Collection</h4>
                        <p>We collect only what is strictly necessary. For viewers, this means temporary storage of your video blob (which is automatically deleted after the streamer reacts or rejects it). For streamers, we store your OAuth ID and Payout URL.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">2. Payment Privacy</h4>
                        <p>We do not store your credit card numbers, billing addresses, or banking details. All transactions happen off-platform via the streamer's designated processor.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">3. Third-Party Sharing</h4>
                        <p>We never sell your data. We only share necessary authentication tokens with our backend provider (Supabase) to maintain your secure session.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">4. Your Right to be Forgotten (GDPR)</h4>
                        <p>You can instantly delete your entire account, queue, and associated data via the "Delete Account" button in your Dashboard Settings. This action is irreversible.</p>
                    </section>
                </div>
`;
html = html.replace(/<h3 class="text-2xl font-black mb-6 text-white">Privacy Policy<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<div class="p-6 border-t border-white\/5 bg-black\/20 pointer-events-auto">/, privacyHTML + `</div>\n            <div class="p-6 border-t border-white/5 bg-black/20 pointer-events-auto">`);

fs.writeFileSync('whutcha-web/index.html', html);
console.log('Fixed index.html comprehensively.');
