const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

js = js.replace(/async function signOut\(\)/, 'window.signOut = async function()');
js = js.replace(/function closeModal\(id\)/, 'window.closeModal = function(id)');
js = js.replace(/function requestNotifications\(\)/, 'window.requestNotifications = async function()');

fs.writeFileSync('whutcha-web/dashboard.js', js);
