const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const backBtnSvg = `<button onclick="closeModal(this.closest('.fixed.inset-0').id)" class="absolute top-6 left-6 text-silver hover:text-white flex items-center gap-2 font-bold text-sm transition-colors z-50 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10">← Go Back</button>`;

const modals = ['settings-modal', 'reaction-modal', 'costream-modal'];
modals.forEach(modalId => {
    const modalTarget = `id="${modalId}"`;
    if (html.includes(modalTarget)) {
        // find the first '<div class="glass-card' or '<div class="bg-surface' inside the modal
        html = html.replace(new RegExp(`(<div id="${modalId}"[^>]*>[\\s\\S]*?<div class="[^"]*(glass-card|bg-surface)[^"]*"[^>]*>)`), `$1\n            ${backBtnSvg}`);
    }
});

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Added Go Back to Dashboard Modals.');
