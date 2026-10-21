const fs = require('fs');

const files = [
    'whutcha-web/index.html',
    'whutcha-web/dashboard.html',
    'whutcha-web/viewer.html'
];

files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');

    // 1. Better Focus Rings
    html = html.replace(/focus:outline-none focus:border-primary/g, 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent');

    // 2. Better Contrast for small text
    html = html.replace(/text-gray-500/g, 'text-gray-400');
    html = html.replace(/text-silver\/40/g, 'text-silver/70');
    html = html.replace(/text-silver\/50/g, 'text-silver/80');

    // 3. Add aria-labels to icon buttons
    html = html.replace('id="btn-sync-queue" onclick="syncQueue()" class="', 'id="btn-sync-queue" onclick="syncQueue()" aria-label="Sync pending donations" class="');
    html = html.replace('onclick="signOut()" class="hidden md:flex', 'onclick="signOut()" aria-label="Sign out" class="hidden md:flex');
    html = html.replace('onclick="copyViewerLink(this)" class="', 'onclick="copyViewerLink(this)" aria-label="Copy viewer link" class="');
    html = html.replace('onclick="copyObsLink(this)" class="', 'onclick="copyObsLink(this)" aria-label="Copy OBS link" class="');
    html = html.replace('onclick="copyViewerUrl()" class="', 'onclick="copyViewerUrl()" aria-label="Copy viewer link" class="');
    html = html.replace('id="btn-dashboard-mute" class="', 'id="btn-dashboard-mute" aria-label="Toggle dashboard audio" class="');
    html = html.replace(/onclick="closeModal\('legal-modal-tos'\)" class="/g, 'onclick="closeModal(\'legal-modal-tos\')" aria-label="Close Terms of Service" class="');
    html = html.replace(/onclick="closeModal\('legal-modal-privacy'\)" class="/g, 'onclick="closeModal(\'legal-modal-privacy\')" aria-label="Close Privacy Policy" class="');
    html = html.replace(/onclick="closeModal\('legal-modal-contact'\)" class="/g, 'onclick="closeModal(\'legal-modal-contact\')" aria-label="Close Contacts" class="');
    html = html.replace(/onclick="closeSettingsModal\(\)" class="/g, 'onclick="closeSettingsModal()" aria-label="Close Settings" class="');
    html = html.replace(/onclick="closeReactionModal\(\)" class="/g, 'onclick="closeReactionModal()" aria-label="Close Reaction Window" class="');

    fs.writeFileSync(file, html);
    console.log(`Grandma Mode patched for ${file}`);
});
