const fs = require('fs');
let js = fs.readFileSync('whutcha-web/app.js', 'utf8');
js = js.replace(/if \(params\.has\('streamer'\)\) \{\s*window\.location\.href = '\.\/index\.html';\s*\}/, '');
fs.writeFileSync('whutcha-web/app.js', js);
