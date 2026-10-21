const fs = require('fs');
const path = require('path');

// 1. Create Icon (SVG)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00F0FF" />
            <stop offset="100%" stop-color="#9D00FF" />
        </linearGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#bg)"/>
    <path d="M156 256l100-100v200z" fill="#1a1d24"/>
    <path d="M356 256l-100 100V156z" fill="#ffffff"/>
</svg>`;
fs.writeFileSync('whutcha-web/icon.svg', iconSvg);

// 2. Create manifest.json
const manifest = {
    "name": "Whutcha Streamer",
    "short_name": "Whutcha",
    "description": "Premium video donations and co-streaming platform",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#1a1d24",
    "theme_color": "#1a1d24",
    "icons": [
        {
            "src": "/icon.svg",
            "sizes": "512x512",
            "type": "image/svg+xml",
            "purpose": "any maskable"
        }
    ]
};
fs.writeFileSync('whutcha-web/manifest.json', JSON.stringify(manifest, null, 4));

// 3. Inject Meta tags into HTML files
const metaTags = `
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1a1d24">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Whutcha">
    <link rel="apple-touch-icon" href="/icon.svg">
`;

function injectMeta(filepath) {
    if (!fs.existsSync(filepath)) return;
    let html = fs.readFileSync(filepath, 'utf8');
    if (!html.includes('rel="manifest"')) {
        html = html.replace('</head>', metaTags + '</head>');
        fs.writeFileSync(filepath, html);
    }
}

injectMeta('whutcha-web/index.html');
injectMeta('whutcha-web/dashboard.html');
injectMeta('whutcha-web/viewer.html');

console.log("PWA setup complete!");
