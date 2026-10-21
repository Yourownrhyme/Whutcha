const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldTrackLogic = `                viewerRoom.localParticipant.on('localTrackPublished', (publication) => {
                    if (publication.track.kind === 'video') {
                        const vidEl = publication.track.attach();
                        vidEl.className = "w-full h-full object-cover scale-x-[-1]";
                        const container = document.getElementById('local-costream-video');
                        container.innerHTML = '';
                        container.appendChild(vidEl);
                    }
                });`;

const newTrackLogic = `                viewerRoom.localParticipant.on('localTrackPublished', (publication) => {
                    if (publication.track && publication.track.kind === 'video') {
                        const vidEl = publication.track.attach();
                        vidEl.className = "w-full h-full object-cover scale-x-[-1]";
                        const container = document.getElementById('local-costream-video');
                        container.innerHTML = '';
                        container.appendChild(vidEl);
                    }
                });
                
                // Fallback for tracks that published instantly
                viewerRoom.localParticipant.videoTrackPublications.forEach((publication) => {
                    if (publication.track) {
                        const vidEl = publication.track.attach();
                        vidEl.className = "w-full h-full object-cover scale-x-[-1]";
                        const container = document.getElementById('local-costream-video');
                        container.innerHTML = '';
                        container.appendChild(vidEl);
                    }
                });`;

if (html.includes(oldTrackLogic)) {
    html = html.replace(oldTrackLogic, newTrackLogic);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log("Chunk 2.4 track fix injected.");
} else {
    console.log("Failed regex chunk 2.4");
}
