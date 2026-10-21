const fs = require('fs');

const files = ['index.html', 'viewer.html', 'overlay.html', 'dashboard.html'];

for (const file of files) {
    let content = fs.readFileSync('whutcha-web/' + file, 'utf8');
    
    // Replace CDN script with correct link
    if (file === 'dashboard.html') {
        content = content.replace('<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="style-dash.css">');
    } else {
        content = content.replace('<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="style.css">');
    }
    
    // Remove the tailwind.config block
    const blockStart = content.indexOf('<script>\n        tailwind.config =');
    if (blockStart !== -1) {
        const blockEnd = content.indexOf('</script>', blockStart) + 9;
        if (blockEnd > 8) {
            content = content.substring(0, blockStart) + content.substring(blockEnd);
        }
    } else {
        // Try other variations of tailwind.config
        const fallbackStart = content.indexOf('tailwind.config');
        if (fallbackStart !== -1) {
           const scriptStart = content.lastIndexOf('<script', fallbackStart);
           if (scriptStart !== -1) {
               const scriptEnd = content.indexOf('</script>', fallbackStart) + 9;
               content = content.substring(0, scriptStart) + content.substring(scriptEnd);
           }
        }
    }
    
    fs.writeFileSync('whutcha-web/' + file, content);
}

console.log("HTML files successfully patched to use static CSS.");
