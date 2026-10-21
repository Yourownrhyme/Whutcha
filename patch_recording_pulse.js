const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const newCSS = `
    .recording-pulse {
        background-color: #FF0055 !important;
        animation: pulse 1s infinite alternate;
        transform: scale(0.8) !important;
        border-radius: 8px !important;
    }
    @keyframes pulse {
        0% { transform: scale(0.8); }
        100% { transform: scale(0.9); }
    }
`;

html = html.replace('</style>', newCSS + '\n</style>');
fs.writeFileSync('whutcha-web/donate-v2.html', html);
