const fs = require('fs');

let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Add shake animation to tailwind config
const searchConfig = `keyframes: {
                        shimmer: {`;
const replaceConfig = `keyframes: {
                        shake: {
                            '0%, 100%': { transform: 'translateX(0)' },
                            '25%': { transform: 'translateX(-10px)' },
                            '75%': { transform: 'translateX(10px)' }
                        },
                        shimmer: {`;

if (html.includes(searchConfig) && !html.includes('shake: {')) {
    html = html.replace(searchConfig, replaceConfig);
}

// Replace alert with visual shake
const oldValidation = `if (currentTab === 'video' && !finalVideoBlob) return alert('Record a video first!');`;
const newValidation = `if (currentTab === 'video' && !finalVideoBlob) {
                // DUMB USER MODE: Visual Error
                const vidSection = document.getElementById('video-section');
                vidSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                vidSection.classList.add('animate-[shake_0.4s_ease-in-out]');
                setTimeout(() => vidSection.classList.remove('animate-[shake_0.4s_ease-in-out]'), 400);
                return;
            }`;

if (html.includes(oldValidation)) {
    html = html.replace(oldValidation, newValidation);
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Dumb User Shake Validation patched.');
