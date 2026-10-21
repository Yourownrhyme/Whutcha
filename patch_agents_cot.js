const fs = require('fs');
let md = fs.readFileSync('AGENTS.md', 'utf8');

const newRule = "11. **MANDATORY WORKFLOW (Chain of Thought Checkpoint):** BEFORE writing any code or making modifications, the AI MUST output a visible block titled `[AAA-CHECK]`. In this block, the AI must explicitly list which of the 17 Stress-Test Modes apply to the current task and how it plans to address them. Skipping this step is a violation of the core directive.\n12. **The Stryker Doctrine (Anti-Hallucination):** The AI must act as a mutation tester. When writing backend logic, proactively think: 'What if this rule fails? What if the user alters the payload?' Build the code to kill these logical mutants.";

// Replace the old Rule 12 (Stryker Doctrine) to insert 11 and 12 correctly, or just append it.
// Let's just find the end of the RULES FOR AGENTS block.
// The last rule currently is 10. Deep Thinking & Pacing...

md = md.replace(/10\. \*\*Deep Thinking & Pacing.*?\n/s, 
    "10. **Deep Thinking & Pacing:** Take as much time as necessary to analyze complex problems. The user is in no rush. Favor deep, rigorous thought over speed, and always break complex tasks into smaller chunks (as per Rule 5).\n" + newRule + "\n"
);

fs.writeFileSync('AGENTS.md', md);
console.log('Patched AGENTS.md with CoT');
