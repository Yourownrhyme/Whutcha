const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// The issue is an extra `return; }` right before `const btnText = document.getElementById('submit-btn-text');`
const badBlock = `                    return;
                }
                    return;
                }`;
// Let's just fix it by replacing the whole listener head.
html = html.replace(/const minAllowed = typeof currentMinPrice !== 'undefined' \? currentMinPrice : 1;[\s\S]*?const btnText = document.getElementById\('submit-btn-text'\);/, 
`const minAllowed = typeof currentMinPrice !== 'undefined' ? currentMinPrice : 1;
                if (isNaN(amount) || amount < minAllowed) {
                    alert(\`Minimum amount for this request is \${minAllowed.toFixed(2)}\`);
                    submitBtn.disabled = false;
                    return;
                }
                
                const btnText = document.getElementById('submit-btn-text');`);

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log("viewer.html dangling brace fixed");
