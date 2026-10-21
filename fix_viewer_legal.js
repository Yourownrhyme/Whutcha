const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldLinks = `            <a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</a>
            <a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</a>`;
            
const newLinks = `            <button onclick="openModal('legal-modal-tos')" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</button>
            <button onclick="openModal('legal-modal-privacy')" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</button>`;

html = html.replace(oldLinks, newLinks);

const legalModals = `
    <!-- Terms Modal -->
    <div id="legal-modal-tos" onclick="if(event.target === this) closeModal(this.id)" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex-col items-center justify-center p-6 opacity-0 transition-opacity duration-300 pointer-events-none">
        <div class="bg-surface border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden shadow-2xl scale-95 transition-transform duration-300">
            <div class="p-8 overflow-y-auto pointer-events-auto">
                <button type="button" onclick="closeModal(this.closest('.fixed.inset-0').id)" class="text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 cursor-pointer pointer-events-auto mb-6 inline-flex">← Go Back</button>
                <h3 class="text-2xl font-black mb-6 text-white">Terms of Service</h3>
                <div class="space-y-6 text-sm text-silver font-medium leading-relaxed custom-scrollbar">
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">1. User Conduct & Content</h4>
                        <p>You are solely responsible for all video, audio, and text you submit. Hate speech, nudity, illegal acts, and harassment are strictly prohibited. The streamer has full discretion to reject your video.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">2. No Refunds</h4>
                        <p>Because all payments are routed directly to the streamer's external wallet, Whutcha cannot issue refunds. If a streamer rejects your video, they may or may not refund you via their processor (e.g. PayPal).</p>
                    </section>
                </div>
            </div>
        </div>
    </div>

    <!-- Privacy Policy Modal -->
    <div id="legal-modal-privacy" onclick="if(event.target === this) closeModal(this.id)" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex-col items-center justify-center p-6 opacity-0 transition-opacity duration-300 pointer-events-none">
        <div class="bg-surface border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden shadow-2xl scale-95 transition-transform duration-300">
            <div class="p-8 overflow-y-auto pointer-events-auto">
                <button type="button" onclick="closeModal(this.closest('.fixed.inset-0').id)" class="text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 cursor-pointer pointer-events-auto mb-6 inline-flex">← Go Back</button>
                <h3 class="text-2xl font-black mb-6 text-white">Privacy Policy</h3>
                <div class="space-y-6 text-sm text-silver font-medium leading-relaxed custom-scrollbar">
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">1. Minimal Data Collection</h4>
                        <p>We collect only what is strictly necessary. We temporarily store your video blob until the streamer reacts or rejects it. Once processed, it is purged.</p>
                    </section>
                    <section>
                        <h4 class="text-white font-bold text-lg mb-2">2. Payment Privacy</h4>
                        <p>We do not store your credit card numbers or banking details. All transactions happen off-platform via the streamer's designated processor.</p>
                    </section>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        window.openModal = function(id) {
            const el = document.getElementById(id);
            if(el) {
                el.classList.remove('hidden');
                el.classList.add('flex');
                el.classList.remove('pointer-events-none');
                setTimeout(() => {
                    el.classList.remove('opacity-0');
                    el.classList.add('opacity-100');
                    el.style.opacity = '';
                }, 10);
            }
        };
        window.closeModal = function(id) {
            const el = document.getElementById(id);
            if(el) {
                el.classList.remove('opacity-100');
                el.classList.add('opacity-0');
                el.classList.add('pointer-events-none');
                setTimeout(() => {
                    el.classList.add('hidden');
                    el.classList.remove('flex');
                }, 300);
            }
        };
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
                activeModals.forEach(modal => {
                    if (modal.id && typeof closeModal === 'function') {
                        closeModal(modal.id);
                    }
                });
            }
        });
    </script>
`;

if (!html.includes('legal-modal-tos')) {
    html = html.replace('</body>', legalModals + '\n</body>');
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Fixed viewer.html legal links.');
