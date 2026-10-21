const fs = require('fs');

const files = ['whutcha-web/index.html', 'whutcha-web/dashboard.html', 'whutcha-web/viewer.html', 'whutcha-web/overlay.html'];

files.forEach(file => {
    try {
        let html = fs.readFileSync(file, 'utf8');
        const searchStr = `colors: { background: '#0B0D12', surface: '#151822', primary: '#00F0FF', silver: '#8B949E' }`;
        const replaceStr = `colors: { background: '#0B0D12', surface: '#151822', primary: '#00F0FF', silver: '#8B949E', secondary: '#9D00FF' },
                    keyframes: {
                        shimmer: {
                            '100%': { transform: 'translateX(100%)' }
                        },
                        slideIn: {
                            '0%': { transform: 'translateY(-20px)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' }
                        }
                    }`;
        if (html.includes(searchStr) && !html.includes('keyframes: {')) {
            html = html.replace(searchStr, replaceStr);
            fs.writeFileSync(file, html);
            console.log(`${file} tailwind config patched.`);
        }
    } catch (e) {
        // ignore missing files
    }
});

// Also patch the button in viewer.html - wait, let me check if the original html had the text inside a span or just text.
