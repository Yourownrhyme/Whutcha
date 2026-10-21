const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const oldOpenModal = `window.openModal = function(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        // Small delay for CSS transition to trigger
        setTimeout(() => {
            el.style.opacity = '1';
        }, 10);
    }
};`;

const newOpenModal = `window.openModal = function(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        setTimeout(() => {
            el.classList.remove('opacity-0');
            el.classList.add('opacity-100');
            el.style.opacity = '';
        }, 10);
    }
};`;

const oldCloseModal = `window.closeModal = function(id) {
    const el = document.getElementById(id);
    if(el) {
        el.style.opacity = '0';
        setTimeout(() => {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }, 300);
    }
};`;

const newCloseModal = `window.closeModal = function(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('opacity-100');
        el.classList.add('opacity-0');
        setTimeout(() => {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }, 300);
    }
};`;

html = html.replace(oldOpenModal, newOpenModal);
html = html.replace(oldCloseModal, newCloseModal);

fs.writeFileSync('whutcha-web/dashboard.html', html);
console.log('Fixed Dashboard Modal Logic.');
