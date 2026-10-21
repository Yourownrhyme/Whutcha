const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// 1. Update the button call inside renderQueueReplacement
js = js.replace(/onclick="openReactionModal\('\\$\\{videoUrl\\}'\)"/, "onclick=\"openReactionModal('${d.id}', '${videoUrl}', '${sanitize(d.username)}')\"");

// 2. Update openReactionModal to store state
const oldReactionFunc = /async function openReactionModal\(videoUrl\) \{/g;
js = js.replace(oldReactionFunc, `
let currentReactionId = null;
let currentReactionUsername = null;
async function openReactionModal(id, videoUrl, username) {
    currentReactionId = id;
    currentReactionUsername = username;
`);

// 3. Update the mediaRecorder.onstop to trigger approval
const oldStopBlock = /a\.download = \`Reaction_\$\{Date\.now\(\)\}\.webm\`;\n\s*a\.click\(\);\n\s*alert\("Reaction video saved to your downloads!"\);\n\s*closeReactionModal\(\);\n\s*\};/;

const newStopBlock = `a.download = \`Reaction_\${Date.now()}.webm\`;
        a.click();
        
        closeReactionModal();
        
        setTimeout(() => {
            if (confirm("Reaction video saved to downloads!\\n\\nDo you want to Approve this donation now and send it to OBS?")) {
                approveDonation(currentReactionId, false, currentReactionUsername);
            }
        }, 500);
    };`;

js = js.replace(oldStopBlock, newStopBlock);

fs.writeFileSync('whutcha-web/dashboard.js', js);
console.log("Phase 4 Reaction UX patched.");
