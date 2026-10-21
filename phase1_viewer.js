const fs = require('fs');

try {
    let content = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

    // Remove postMessage listener
    content = content.replace(/window\.addEventListener\('message', \(event\) => \{[\s\S]*?if \(event\.data === 'startCamera'\) \{[\s\S]*?startRecording\(\);[\s\S]*?\}[\s\S]*?\}\);/g, '');

    // Add auto-start and strict streamer validation
    content = content.replace(/const urlParams = new URLSearchParams\(window\.location\.search\);/g, 
    `const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('streamer');
    if (!streamerId || streamerId === 'default') {
        document.body.innerHTML = '<div style="color:white; padding: 20px; text-align: center; font-family: sans-serif; margin-top: 50px;"><h2>Invalid Streamer Link</h2><p>Please ask the streamer for a valid URL.</p></div>';
        throw new Error("Invalid streamer ID");
    }
    // Auto-start camera directly
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(startRecording, 500);
    });
    `);

    // Remove iframeReady msg
    content = content.replace(/window\.parent\.postMessage\('iframeReady', '\*'\);/g, '');

    // Change back to window.location.href
    content = content.replace(/window\.top\.location\.href = externalLink;/g, 'window.location.href = externalLink;');

    // Fix path to manifest just in case
    content = content.replace(/manifest\.json/g, 'manifest.json');

    fs.writeFileSync('whutcha-web/viewer.html', content);
    console.log("Merged donate-v2.html into viewer.html");

    fs.unlinkSync('whutcha-web/donate-v2.html');
    if (fs.existsSync('whutcha-web/viewer.js')) {
        fs.unlinkSync('whutcha-web/viewer.js');
    }
    console.log("Deleted old iframe files.");

} catch(e) {
    console.error("Error:", e.message);
}
