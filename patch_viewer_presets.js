const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldPresets = `const presets = [1, 2, 5, 10].map(m => m * minPrice);`;
const newPresets = `
            let presets;
            if (minPrice === 1) presets = [1, 2, 5, 10];
            else if (minPrice === 2) presets = [2, 5, 10, 20];
            else if (minPrice === 5) presets = [5, 10, 20, 50];
            else presets = [1, 2, 5, 10].map(m => m * minPrice);
`;

html = html.replace(oldPresets, newPresets);
fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Viewer presets logic updated.');
