const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const regexBtn = /<button onclick="copyViewerUrl\(this\)"(.*?)class="(.*?)"(.*?)>([\s\S]*?)Copy Viewer Link\s*<\/button>/;

const match = html.match(regexBtn);
if (match) {
    let newClasses = match[2];
    if (!newClasses.includes('relative group/tooltip')) {
        newClasses += ' relative group/tooltip';
    }
    const newBtn = '<button onclick="copyViewerUrl(this)"' + match[1] + 'class="' + newClasses + '"' + match[3] + '>' + match[4] + 'Copy Viewer Link\n<div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none w-48 p-2 bg-black/90 border border-white/10 text-silver text-[10px] rounded-lg shadow-2xl z-50 text-center normal-case">Instantly copies your viral link.</div>\n</button>';
    html = html.replace(match[0], newBtn);
    fs.writeFileSync('whutcha-web/dashboard.html', html);
    console.log('Fixed Empty Queue Button');
} else {
    console.log('Not found');
}
