const fs = require('fs');

let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Replace the redundant const amount block
const badBlock = /const amount = parseFloat\(amountInput\.value\) \|\| 0;[\s\S]*?const amount = parseFloat\(amountInput\.value\);[\s\S]*?const amount = parseFloat\(amountInput\.value\);/m;

const newBlock = `const amount = parseFloat(amountInput.value) || 0;
                const nickname = document.getElementById('nickname').value || "Anonymous";
                
                if (currentTab === 'video' && !finalVideoBlob) {
                    alert("Please record a video message first!");
                    submitBtn.disabled = false;
                    return;
                }

                const minAllowed = typeof currentMinPrice !== 'undefined' ? currentMinPrice : 1;
                if (isNaN(amount) || amount < minAllowed) {
                    alert(\`Minimum amount for this request is \${minAllowed.toFixed(2)}\`);
                    submitBtn.disabled = false;
                    return;
                }`;

html = html.replace(/const amount = parseFloat\(amountInput\.value\) \|\| 0;[\s\S]*?alert\(\`Minimum amount for this request is \$\{minAllowed.toFixed\(2\)\}\`\);/m, newBlock);

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log("viewer.html JS syntax fixed");
