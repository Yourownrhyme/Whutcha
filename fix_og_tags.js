const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const ogTags = `
    <!-- OPEN GRAPH / SOCIAL CRAWLERS (Phase 2 SEO) -->
    <meta property="og:title" content="Join my Live Stream! 🔴">
    <meta property="og:description" content="Send a video message or jump onto the stream right now. Don't just watch, be part of the show!">
    <meta property="og:image" content="https://whutcha.com/og-banner.jpg">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Jump into the Live Stream!">
    <meta name="twitter:description" content="Send a video message or jump onto the stream right now on Whutcha.">
    <meta name="twitter:image" content="https://whutcha.com/og-banner.jpg">
`;

html = html.replace(/<title>Send Reaction - Whutcha<\/title>/, '<title>Send Reaction - Whutcha</title>\n' + ogTags);
fs.writeFileSync('whutcha-web/viewer.html', html);
