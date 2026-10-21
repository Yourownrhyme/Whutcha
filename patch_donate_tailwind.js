const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const headEnd = '</title>';
const inject = `</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        background: '#09090b',
                        surface: '#18181b',
                        primary: '#D8FF00',
                        secondary: '#FF0055'
                    }
                }
            }
        }
    </script>`;

html = html.replace(headEnd, inject);

// Also remove old custom styles that conflict
html = html.replace(/\.card-box \{[\s\S]*?\}/, '.card-box { @apply brutal-card p-6; }');
html = html.replace(/\.form-input \{[\s\S]*?\}/, '.form-input { @apply w-full p-4 brutal-input mb-4; }');
html = html.replace(/\.tab-btn \{[\s\S]*?\}/, '.tab-btn { @apply flex-1 py-3 text-center font-black uppercase text-sm border-2 rounded-xl transition-all; }');
html = html.replace(/\.active-tab \{[\s\S]*?\}/, '.active-tab { @apply bg-primary text-black border-black shadow-[4px_4px_0_#fff]; }');
html = html.replace(/\.inactive-tab \{[\s\S]*?\}/, '.inactive-tab { @apply bg-surface text-gray-500 border-surface hover:text-white; }');

fs.writeFileSync('whutcha-web/donate-v2.html', html);
