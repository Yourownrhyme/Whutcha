const fs = require('fs');
let code = fs.readFileSync('whutcha-web/app.js', 'utf8');

const validationFunction = `
function validateTerms() {
    const checkbox = document.getElementById('terms-checkbox');
    const authError = document.getElementById('auth-error');
    if (checkbox && !checkbox.checked) {
        if(authError) {
            authError.textContent = "Please accept the Terms of Use and Privacy Policy to continue.";
            authError.classList.remove('hidden');
        } else {
            alert("Please accept the Terms of Use and Privacy Policy to continue.");
        }
        return false;
    }
    return true;
}

async function handleEmailAuth`;

code = code.replace('async function handleEmailAuth', validationFunction);

// Inject into handleEmailAuth
code = code.replace(/if \(!authError \|\| !emailInput \|\| !passwordInput\) return;\s*authError\.classList\.add\('hidden'\);/g, "if (!authError || !emailInput || !passwordInput) return;\n    if (!validateTerms()) return;\n    authError.classList.add('hidden');");

// Inject into signInOAuth
code = code.replace('window.signInOAuth = async (provider) => {', 'window.signInOAuth = async (provider) => {\n    if (!validateTerms()) return;');

fs.writeFileSync('whutcha-web/app.js', code);
console.log('patched app.js');
