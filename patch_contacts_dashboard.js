const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Update the Legal Block buttons in footer
const newButtons = `
            <!-- Footer -->
            <div class="mt-auto pt-10 pb-6 border-t border-white/5 flex flex-wrap justify-center gap-6">
                <button onclick="openModal('legal-modal-tos')" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</button>
                <button onclick="openModal('legal-modal-privacy')" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</button>
                <button onclick="openModal('legal-modal-contact')" class="text-primary text-xs font-bold hover:text-white transition-colors uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">Contacts</button>
            </div>
`;
html = html.replace(/<!-- Footer -->[\s\S]*?<\/div>/, newButtons);

// 2. Insert the Contact modal
const contactModal = `
    <!-- Contact Modal -->
    <div id="legal-modal-contact" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex-col items-center justify-center p-6 opacity-0 transition-opacity duration-300">
        <div class="bg-surface border border-white/10 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col relative overflow-hidden shadow-2xl scale-95 transition-transform duration-300">
            <button onclick="closeModal('legal-modal-contact')" class="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div class="p-8 overflow-y-auto text-center pt-12">
                <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <h3 class="text-2xl font-black mb-4 text-white">Get in Touch</h3>
                <div class="space-y-4 text-sm text-silver font-semibold leading-relaxed">
                    <p>This platform is built entirely by <span class="text-white">one person</span>, but I am always eager to hear your feedback, feature requests, or complaints to make it better and more human.</p>
                    <a href="mailto:yourdealoff@gmail.com" class="inline-block mt-4 text-xl font-bold text-primary hover:text-white transition-colors">yourdealoff@gmail.com</a>
                </div>
            </div>
            <div class="p-6 border-t border-white/5 bg-black/20">
                <button onclick="closeModal('legal-modal-contact')" class="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors">Close</button>
            </div>
        </div>
    </div>
`;
html = html.replace('<!-- Privacy Policy Modal -->', contactModal + '\n    <!-- Privacy Policy Modal -->');

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('patched dashboard.html');
