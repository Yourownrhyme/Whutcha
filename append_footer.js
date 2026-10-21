const fs = require('fs');

let dashHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const footerHTML = `
            <!-- Footer -->
            <div class="mt-auto pt-10 pb-6 border-t border-white/5 flex justify-center gap-6">
                <a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</a>
                <a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</a>
            </div>
`;

// Insert it right before the closing </main>
dashHtml = dashHtml.replace(/<\/main>/, footerHTML + '\n    </main>');

fs.writeFileSync('whutcha-web/dashboard.html', dashHtml);
