const fs = require('fs');

const ogBannerUrl = 'https://whutcha.com/og-banner.jpg'; // Assuming deployment to whutcha.com

// 1. Patch index.html
let indexHtml = fs.readFileSync('whutcha-web/index.html', 'utf8');
const indexOgTags = `
    <!-- SEAGULL MODE: OpenGraph / Twitter Cards -->
    <meta property="og:title" content="Whutcha - Premium Video Donations & Co-Streams">
    <meta property="og:description" content="Monetize your stream like never before. Let viewers send video messages and request instant live Co-Streams directly into your OBS.">
    <meta property="og:image" content="${ogBannerUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Whutcha - Premium Video Donations">
    <meta name="twitter:description" content="Monetize your stream like never before. Let viewers send video messages.">
    <meta name="twitter:image" content="${ogBannerUrl}">
`;
if (!indexHtml.includes('SEAGULL MODE')) {
    indexHtml = indexHtml.replace('</title>', '</title>\n' + indexOgTags);
    fs.writeFileSync('whutcha-web/index.html', indexHtml);
    console.log('index.html patched with OG tags.');
}

// 2. Patch viewer.html
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
const viewerOgTags = `
    <!-- SEAGULL MODE: OpenGraph / Twitter Cards -->
    <meta property="og:title" content="Join my Live Stream! 🔴">
    <meta property="og:description" content="Send a video message or jump onto the stream right now. Don't just watch, be part of the show!">
    <meta property="og:image" content="${ogBannerUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Join my Live Stream! 🔴">
    <meta name="twitter:description" content="Send a video message or jump onto the stream right now.">
    <meta name="twitter:image" content="${ogBannerUrl}">
`;

// Remove the old hardcoded tags first to prevent duplicates
viewerHtml = viewerHtml.replace(/<meta property="og:title" content="Join my Live Stream! 🔴">/g, '');
viewerHtml = viewerHtml.replace(/<meta property="og:description" content="Send a video message or jump onto the stream right now. Don't just watch, be part of the show!">/g, '');
viewerHtml = viewerHtml.replace(/<meta property="og:image" content="https:\/\/whutcha.com\/og-banner.jpg">/g, '');
viewerHtml = viewerHtml.replace(/<meta property="og:type" content="website">/g, '');

if (!viewerHtml.includes('SEAGULL MODE')) {
    viewerHtml = viewerHtml.replace('</title>', '</title>\n' + viewerOgTags);
    // Cleanup empty lines left by replace
    viewerHtml = viewerHtml.replace(/^\s*[\r\n]/gm, '');
    fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
    console.log('viewer.html patched with OG tags.');
}
