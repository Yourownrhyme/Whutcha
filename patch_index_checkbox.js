const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const checkboxBlock = `
            <label class="flex items-start gap-3 mt-8 mb-4 cursor-pointer group">
                <div class="relative flex items-center justify-center mt-1">
                    <input type="checkbox" id="terms-checkbox" class="peer sr-only">
                    <div class="w-5 h-5 border-2 border-white/20 rounded bg-black/50 peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                        <svg class="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                </div>
                <span class="text-xs text-silver font-semibold leading-relaxed select-none group-hover:text-gray-300 transition-colors">
                    I agree to the <button type="button" onclick="openModal('legal-modal-tos'); event.preventDefault();" class="text-white hover:text-primary transition-colors underline decoration-white/30 underline-offset-2">Terms of Use</button> and <button type="button" onclick="openModal('legal-modal-privacy'); event.preventDefault();" class="text-white hover:text-primary transition-colors underline decoration-white/30 underline-offset-2">Privacy Policy</button>
                </span>
            </label>
        </div>
        
        
        <!-- Legal block -->
`;

html = html.replace(/<\/div>\s*<!-- Legal block -->/g, checkboxBlock);
fs.writeFileSync('whutcha-web/index.html', html);
console.log('patched index checkbox');
