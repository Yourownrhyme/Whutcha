const fs = require('fs');
let js = fs.readFileSync('whutcha-web/app.js', 'utf8');

js = js.replace(/if \(isViewer\) \{[\s\S]*?setTimeout\(openSidebar, 500\);\n        \}/, `if (isViewer) {
            // Hide Sign In elements and show Viewer specific message
            const loginBlock = document.querySelector('.max-w-sm.space-y-3');
            const signInHeading = document.querySelector('h2.text-2xl');
            if (loginBlock) loginBlock.style.display = 'none';
            if (signInHeading) signInHeading.textContent = 'Drop a Vibe 👉';
            
            // Auto-open sidebar for viewers if they visit a direct link
            setTimeout(openSidebar, 500);
        }`);

fs.writeFileSync('whutcha-web/app.js', js);
