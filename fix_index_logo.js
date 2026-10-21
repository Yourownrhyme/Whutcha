const fs = require('fs');
let html = fs.readFileSync('whutcha-web/index.html', 'utf8');

const regex = /<span class="text-white drop-shadow-\[0_0_20px_rgba\(255,255,255,0\.2\)\]">WHUT<\/span><br>\s*<span class="bg-gradient-to-r from-primary via-\[#00f0ff\] to-\[#9D00FF\] bg-clip-text text-transparent drop-shadow-\[0_0_30px_rgba\(0,240,255,0\.4\)\]">CHA\.<\/span>/g;

const replacement = `<span class="bg-gradient-to-r from-white via-[#00f0ff] to-[#9D00FF] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]">WHUTCHA.</span>`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('whutcha-web/index.html', html);
    console.log('Fixed WHUTCHA logo wrapping issue.');
} else {
    console.log('Regex did not match WHUTCHA text in index.html!');
    // Let's print out what is there
    const lines = html.split('\n');
    const index = lines.findIndex(l => l.includes('WHUT'));
    console.log(lines.slice(index-2, index+3).join('\n'));
}

