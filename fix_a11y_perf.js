const fs = require('fs');

const fixFile = (filePath) => {
    if(!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Add standard meta description if missing
    if(!html.includes('<meta name="description"')) {
        html = html.replace(/<title>(.*?)<\/title>/, 
        '<title>$1</title>\n    <meta name="description" content="Whutcha is the elite 2026 platform for Video-Donations and Instant Co-Streams.">');
    }

    // 2. Add aria-labels to inputs if missing
    html = html.replace(/<input type="email" id="auth-email"/g, '<input type="email" id="auth-email" aria-label="Email Address"');
    html = html.replace(/<input type="password" id="auth-password"/g, '<input type="password" id="auth-password" aria-label="Password"');
    
    // Add for attributes to labels
    html = html.replace(/<label class="flex items-start gap-3 cursor-pointer group">/, '<label for="terms-checkbox" class="flex items-start gap-3 cursor-pointer group">');
    
    // Viewer labels
    html = html.replace(/<label([^>]*)>Your Name<\/label>/g, '<label for="nickname" $1>Your Name</label>');
    html = html.replace(/<label([^>]*)>Donation Amount<\/label>/g, '<label for="amount-input" $1>Donation Amount</label>');
    
    // Fix typography mismatch from previous script in viewer
    html = html.replace(/<label for="nickname" class="[^"]*">Your Name<\/label>/g, '<label for="nickname" class="block text-[10px] font-black text-[#9d00ff] mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(157,0,255,0.3)]">Your Name</label>');
    html = html.replace(/<label for="amount-input" class="[^"]*">Donation Amount<\/label>/g, '<label for="amount-input" class="block text-[10px] font-black text-[#9d00ff] mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(157,0,255,0.3)]">Donation Amount</label>');

    // Buttons with SVG icons lacking aria-label
    // Example: Settings button in dashboard
    html = html.replace(/<button onclick="openSettingsModal\(\)" class="w-10 h-10/g, '<button aria-label="Open Settings" onclick="openSettingsModal()" class="w-10 h-10');

    // Make sure html has lang="en"
    if(!html.includes('lang="en"')) {
        html = html.replace(/<html(.*?)>/, '<html lang="en" $1>');
    }

    fs.writeFileSync(filePath, html);
    console.log('Fixed A11y & Perf metadata on: ' + filePath);
};

fixFile('whutcha-web/index.html');
fixFile('whutcha-web/dashboard.html');
fixFile('whutcha-web/viewer.html');
