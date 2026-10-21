const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

html = html.replace(/background: '#0c0c12',[\s\S]*?secondary: '#00E5FF'/, `background: '#0c001a',
                        surface: '#180033',
                        primary: '#b000ff',
                        secondary: '#00e5ff'`);
                        
html = html.replace(/background-color: #0c0c12;/, 'background-color: transparent;');
fs.writeFileSync('whutcha-web/donate-v2.html', html);
