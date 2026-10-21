const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const backBtnSvg = `<button type="button" onclick="closeModal(this.closest('.fixed.inset-0').id)" class="absolute top-4 left-4 text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors z-50 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10 cursor-pointer pointer-events-auto">← Go Back</button>`;

const modals = ['legal-modal-tos', 'legal-modal-privacy', 'legal-modal-contact'];
modals.forEach(modalId => {
    const modalTarget = `id="${modalId}"`;
    if (html.includes(modalTarget)) {
        html = html.replace(new RegExp(`(<div id="${modalId}"[^>]*>[\\s\\S]*?<div class="[^"]*(bg-surface)[^"]*"[^>]*>)`), `$1\n            ${backBtnSvg}`);
    }
});

fs.writeFileSync('whutcha-web/index.html', html);
console.log('Added Go Back to Index Modals.');
