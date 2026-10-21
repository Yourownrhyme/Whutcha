const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const obsText = `<p class="text-xs text-gray-400 mb-4">Add this URL as a Browser Source in OBS to show live donations on your stream.</p>`;
const obsHint = `<p class="text-xs text-gray-400 mb-4 bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
    <strong class="text-white block mb-1">Что это и почему тут пустой экран? 🧐</strong>
    Это не сайт для людей, это специальная невидимая (прозрачная) страница для программы OBS Studio. Ты добавляешь эту ссылку в OBS как "Browser Source", растягиваешь на весь экран поверх игры, и забываешь. Когда зритель отправит донат, видео автоматически появится прямо на твоем стриме!
</p>`;

html = html.replace(obsText, obsHint);
fs.writeFileSync('whutcha-web/dashboard.html', html);
