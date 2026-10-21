const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');
html = html.replace(/<a id="btn-view-my-page" href="\.\/index\.html"[\s\S]*?<\/a>/, '');
fs.writeFileSync('whutcha-web/dashboard.html', html);

let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
js = js.replace(/const viewMyPageBtn = document\.getElementById\('btn-view-my-page'\);\s*if \(viewMyPageBtn\) \{\s*viewMyPageBtn\.href = `\.\/index\.html\?streamer=\$\{currentUser\.id\}`;\s*\}/, '');
fs.writeFileSync('whutcha-web/dashboard.js', js);
