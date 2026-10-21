const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// Inject frame killer script at the very top of <head>
const frameKiller = `
    <!-- Anti-Clickjacking Framekiller -->
    <style id="antiClickjack">body{display:none !important;}</style>
    <script type="text/javascript">
        if (self === top) {
            var antiClickjack = document.getElementById("antiClickjack");
            antiClickjack.parentNode.removeChild(antiClickjack);
        } else {
            top.location = self.location;
        }
    </script>
`;

if (!html.includes('antiClickjack')) {
    html = html.replace('<head>', '<head>\n' + frameKiller);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log("Anti-Clickjacking Framekiller added.");
}
