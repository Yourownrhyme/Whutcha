const fs = require('fs');
let js = fs.readFileSync('whutcha-web/app.js', 'utf8');

js = js.replace(/const loginBlock = document\.querySelector\('.*?'\);/, `const loginBlock = document.getElementById('login-block');`);
js = js.replace(/const signInHeading = document\.querySelector\('.*?'\);/, `const signInHeading = document.getElementById('sign-in-heading');`);

fs.writeFileSync('whutcha-web/app.js', js);
