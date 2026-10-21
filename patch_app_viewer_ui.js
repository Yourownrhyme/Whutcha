const fs = require('fs');
let js = fs.readFileSync('whutcha-web/app.js', 'utf8');

const newViewerLogic = `
        if (isViewer) {
            // Hide Sign In elements and Onboarding text
            const loginBlock = document.getElementById('login-block');
            const onboardingText = document.getElementById('onboarding-text');
            const viewerProfile = document.getElementById('viewer-profile');
            const legalFooter = document.querySelector('.mt-8.text-center.text-xs');
            
            if (loginBlock) loginBlock.style.display = 'none';
            if (onboardingText) onboardingText.style.display = 'none';
            if (legalFooter) legalFooter.style.display = 'none';
            
            if (viewerProfile) {
                viewerProfile.classList.remove('hidden');
                viewerProfile.classList.add('flex');
            }
            
            // Auto-open sidebar for viewers if they visit a direct link
            setTimeout(openSidebar, 500);
        }`;

js = js.replace(/if \(isViewer\) \{[\s\S]*?setTimeout\(openSidebar, 500\);\n        \}/, newViewerLogic);

fs.writeFileSync('whutcha-web/app.js', js);
