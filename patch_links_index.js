const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const oldTerms = `<button type="button" onclick="openModal('legal-modal-tos'); event.stopPropagation(); event.preventDefault();" class="text-white hover:text-primary transition-colors underline decoration-white/30 underline-offset-2">Terms of Use</button>`;
const newTerms = `<a href="#" onclick="openModal('legal-modal-tos'); event.stopPropagation(); event.preventDefault(); return false;" class="text-white hover:text-primary transition-colors underline decoration-white/30 underline-offset-2 relative z-50">Terms of Use</a>`;

const oldPriv = `<button type="button" onclick="openModal('legal-modal-privacy'); event.stopPropagation(); event.preventDefault();" class="text-white hover:text-primary transition-colors underline decoration-white/30 underline-offset-2">Privacy Policy</button>`;
const newPriv = `<a href="#" onclick="openModal('legal-modal-privacy'); event.stopPropagation(); event.preventDefault(); return false;" class="text-white hover:text-primary transition-colors underline decoration-white/30 underline-offset-2 relative z-50">Privacy Policy</a>`;

html = html.replace(oldTerms, newTerms);
html = html.replace(oldPriv, newPriv);

fs.writeFileSync('whutcha-web/index.html', html);
console.log('Fixed Links');
