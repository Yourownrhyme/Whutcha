const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const oldSwitchTab = `function switchTab(tab) {
                currentTab = tab;
                if (tab === 'video') {
                    tabVideo.className = 'tab-btn active-tab';
                    tabCostream.className = 'tab-btn inactive-tab';
                    videoSection.classList.remove('hidden');
                    costreamSection.classList.add('hidden');
                    if (!finalVideoBlob) startCamera();
                } else {
                    tabCostream.className = 'tab-btn active-tab';
                    tabVideo.className = 'tab-btn inactive-tab';
                    costreamSection.classList.remove('hidden');
                    videoSection.classList.add('hidden');
                    stopCamera();
                }
            }`;

const newSwitchTab = `function switchTab(tab) {
                currentTab = tab;
                const activeClasses = 'flex-1 py-3 text-sm font-black uppercase text-black bg-primary rounded-lg transition-all'.split(' ');
                const inactiveClasses = 'flex-1 py-3 text-sm font-black uppercase text-gray-500 hover:text-white rounded-lg transition-all'.split(' ');
                
                if (tab === 'video') {
                    tabVideo.className = activeClasses.join(' ');
                    tabCostream.className = inactiveClasses.join(' ');
                    videoSection.classList.remove('hidden');
                    costreamSection.classList.add('hidden');
                    if (!finalVideoBlob) startCamera();
                } else {
                    tabCostream.className = activeClasses.join(' ');
                    tabVideo.className = inactiveClasses.join(' ');
                    costreamSection.classList.remove('hidden');
                    videoSection.classList.add('hidden');
                    stopCamera();
                }
            }`;

html = html.replace(oldSwitchTab, newSwitchTab);
fs.writeFileSync('whutcha-web/donate-v2.html', html);
