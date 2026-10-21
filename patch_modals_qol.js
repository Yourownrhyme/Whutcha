const fs = require('fs');

function patchFile(filename) {
    let html = fs.readFileSync(filename, 'utf8');

    // 1. Add onclick for backdrop click
    html = html.replace(/<div\s+id="([^"]+)"\s+class="fixed inset-0/g, (match, p1) => {
        // Don't add if already there
        if (html.includes(`closeModal(this.id)`)) {
            // We might have run it before, but let's just do a clean replace
        }
        return `<div id="${p1}" onclick="if(event.target === this) closeModal(this.id)" class="fixed inset-0`;
    });

    // Clean up if it was already added to prevent duplicates
    html = html.replace(/(onclick="if\(event\.target === this\) closeModal\(this\.id\)"\s*)+/g, 'onclick="if(event.target === this) closeModal(this.id)" ');

    // 2. Add Escape key listener
    const escapeListener = `
        // --- Modal QoL ---
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
                activeModals.forEach(modal => {
                    if (modal.id && typeof closeModal === 'function') {
                        closeModal(modal.id);
                    }
                });
            }
        });
    `;

    // Inject before the closing body tag or inside the main script
    if (!html.includes("if (e.key === 'Escape')")) {
        html = html.replace('</body>', `<script>${escapeListener}</script>\n</body>`);
    }

    fs.writeFileSync(filename, html);
    console.log(`Patched ${filename}`);
}

patchFile('whutcha-web/index.html');
patchFile('whutcha-web/dashboard.html');
