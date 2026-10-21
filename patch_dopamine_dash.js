const fs = require('fs');

let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');
if (!html.includes('keyframes: {')) {
    html = html.replace('silver: \'#b0b5c0\'', `silver: '#b0b5c0'\n                    },\n                    keyframes: {\n                        shimmer: { '100%': { transform: 'translateX(100%)' } },\n                        slideIn: { '0%': { transform: 'translateY(-20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }\n                    }`);
    fs.writeFileSync('whutcha-web/dashboard.html', html);
    console.log('dashboard.html config patched.');
}
