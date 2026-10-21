const fs = require('fs');

const brutalStyle = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&display=swap');

    body {
        background-color: #09090b;
        color: #ffffff;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        overflow-x: hidden;
    }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    /* Neo-Brutalist utilities */
    .brutal-card {
        background: #18181b;
        border: 3px solid #27272a;
        border-radius: 16px;
        box-shadow: 6px 6px 0px rgba(0,0,0,1);
        transition: transform 0.1s, box-shadow 0.1s;
    }
    .brutal-card:hover {
        border-color: #D8FF00;
        box-shadow: 6px 6px 0px #D8FF00;
        transform: translate(-2px, -2px);
    }
    
    .brutal-btn-primary {
        background: #D8FF00;
        color: #000;
        border: 3px solid #000;
        border-radius: 12px;
        box-shadow: 4px 4px 0px #fff;
        font-weight: 900;
        text-transform: uppercase;
        transition: all 0.1s;
    }
    .brutal-btn-primary:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px #fff;
    }
    .brutal-btn-primary:active {
        transform: translate(4px, 4px);
        box-shadow: 0px 0px 0px #fff;
    }

    .brutal-btn-secondary {
        background: #18181b;
        color: #fff;
        border: 3px solid #3f3f46;
        border-radius: 12px;
        font-weight: 700;
        transition: all 0.1s;
    }
    .brutal-btn-secondary:hover {
        border-color: #fff;
        background: #27272a;
    }

    .brutal-input {
        background: #09090b;
        border: 3px solid #3f3f46;
        color: #D8FF00;
        border-radius: 12px;
        font-weight: 700;
    }
    .brutal-input:focus {
        border-color: #D8FF00;
        outline: none;
    }
</style>
`;

const tailwindConfig = `
<script>
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    background: '#09090b',
                    surface: '#18181b',
                    primary: '#D8FF00',
                    secondary: '#FF0055',
                    cyan: '#00F0FF'
                },
                fontFamily: {
                    sans: ['Space Grotesk', 'sans-serif'],
                }
            }
        }
    }
</script>
`;

function patchFile(file) {
    if(!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');
    
    // Replace script tailwind config
    html = html.replace(/<script>[\s\S]*?tailwind\.config = [\s\S]*?<\/script>/, tailwindConfig);
    
    // Replace entire <style> block
    html = html.replace(/<style>[\s\S]*?<\/style>/, brutalStyle);
    
    // Remove aurora elements
    html = html.replace(/<div class="aurora-bg">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');
    html = html.replace(/<div class="aurora-bg">[\s\S]*?<\/div>/, '');
    
    fs.writeFileSync(file, html);
}

patchFile('whutcha-web/index.html');
patchFile('whutcha-web/dashboard.html');
patchFile('whutcha-web/viewer.html');
patchFile('whutcha-web/donate-v2.html');

