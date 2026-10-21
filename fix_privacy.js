const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const privacyModal = `
    <!-- Privacy Policy Modal -->
    <div id="legal-modal-privacy" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex-col items-center justify-center p-6 opacity-0 transition-opacity duration-300">
        <div class="bg-surface border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden shadow-2xl scale-95 transition-transform duration-300">
            <button onclick="closeModal('legal-modal-privacy')" class="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div class="p-8 overflow-y-auto">
                <h3 class="text-2xl font-black mb-6 text-white">Privacy Policy</h3>
                <div class="space-y-4 text-sm text-silver font-semibold leading-relaxed">
                    <p>Your privacy is important to us. This policy outlines how we handle your data.</p>
                    <p>1. Data Collection: We collect only the information necessary to provide you with the Whutcha platform services, including your email and stream preferences.</p>
                    <p>2. Video Processing: Co-stream video requests are processed and stored temporarily. Once completed, they are permanently removed from our active servers within 30 days.</p>
                    <p>3. Payments: All payment processing is handled by third-party secure providers (e.g., Stripe, LemonSqueezy). We do not store your credit card information.</p>
                </div>
            </div>
            <div class="p-6 border-t border-white/5 bg-black/20">
                <button onclick="closeModal('legal-modal-privacy')" class="mt-6 w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors">Close</button>
            </div>
        </div>
    </div>
`;

html = html.replace('</body>', privacyModal + '\n</body>');
fs.writeFileSync('whutcha-web/dashboard.html', html);
