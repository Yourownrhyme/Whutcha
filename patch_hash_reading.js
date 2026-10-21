const fs = require('fs');

// dashboard.js
let djs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
djs = djs.replace(/const hash = d\.video_hash;/g, "const hash = d.videoHash || d.video_hash || '';");
djs = djs.replace(/d\.video_hash\.toLowerCase\(\)/g, "(d.videoHash || d.video_hash || '').toLowerCase()");
djs = djs.replace(/d\.video_hash/g, "(d.videoHash || d.video_hash)");
fs.writeFileSync('whutcha-web/dashboard.js', djs);

// overlay.html
let ohtml = fs.readFileSync('whutcha-web/overlay.html', 'utf8');
ohtml = ohtml.replace(/donation\.video_hash/g, "(donation.videoHash || donation.video_hash)");
fs.writeFileSync('whutcha-web/overlay.html', ohtml);

