const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

html = html.replace('<video id="reaction-viewer-vid"', '<video id="reaction-viewer-vid" crossorigin="anonymous"');

fs.writeFileSync('whutcha-web/dashboard.html', html);
