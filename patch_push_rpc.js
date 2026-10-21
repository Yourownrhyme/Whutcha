const fs = require('fs');

let dashJs = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Replace the old profile update with the RPC call
const oldSubUpdate = /const \{ error: subErr \} = await supabaseClient\.from\('profiles'\)\.update\(\{ push_subscription: subscription \}\)\.eq\('id', currentUser\.id\);/g;
const newSubUpdate = `const { error: subErr } = await supabaseClient.rpc('save_push_subscription', { p_subscription: subscription });`;

dashJs = dashJs.replace(oldSubUpdate, newSubUpdate);
fs.writeFileSync('whutcha-web/dashboard.js', dashJs);
console.log("dashboard.js updated to use RPC for push subscriptions.");
