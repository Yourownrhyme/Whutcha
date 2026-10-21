const fs = require('fs');

let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const seoBlock = `<!-- Primary Meta Tags -->
    <title>Whutcha - Jump on Stream!</title>
    <meta name="title" content="Whutcha - Jump on Stream!">
    <meta name="description" content="Support your favorite creator! Send a live Video Message or jump into a Co-Stream directly on their broadcast.">
    <meta name="theme-color" content="#1a1d24">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Whutcha">

    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://whutcha.com/">
    <meta property="og:title" content="Whutcha - Drop a Live Reaction!">
    <meta property="og:description" content="Surprise your favorite streamer with a live video donation. Pay to jump on stream instantly!">
    <meta property="og:image" content="https://whutcha.com/social-preview.jpg">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://whutcha.com/">
    <meta property="twitter:title" content="Whutcha - Drop a Live Reaction!">
    <meta property="twitter:description" content="Surprise your favorite streamer with a live video donation. Pay to jump on stream instantly!">
    <meta property="twitter:image" content="https://whutcha.com/social-preview.jpg">`;

viewerHtml = viewerHtml.replace(/<title>Whutcha - Send a Message<\/title>/, seoBlock);

fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);

console.log("Mode 2 (Social Crawler) patches applied.");
