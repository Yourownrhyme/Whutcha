const fs = require('fs');

let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Replace select('*') with a strict safelist
const oldQuery = /await supabase\.from\('profiles'\)\.select\('\*'\)\.eq\('id', streamerId\)\.single\(\);/;
const newQuery = `await supabase.from('profiles').select('username, avatar_url, min_video_price, min_costream_price').eq('id', streamerId).single();`;

if (oldQuery.test(viewerHtml)) {
    viewerHtml = viewerHtml.replace(oldQuery, newQuery);
    fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
    console.log("Mode 5 (Data Vampire) patch applied successfully.");
} else {
    console.log("Could not find the select('*') query. Maybe it was already changed?");
}
