const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// The replacement logic:
const original = `    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    donations.forEach(d => {`;

const whaleProtector = `    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // WHALE MODE PROTECTOR: Hard limit to prevent DOM/Video OOM crashes
    const VISIBLE_LIMIT = 5;
    const visibleDonations = donations.slice(0, VISIBLE_LIMIT);
    const hiddenCount = donations.length - VISIBLE_LIMIT;
    
    visibleDonations.forEach(d => {`;

if (!js.includes('WHALE MODE PROTECTOR')) {
    js = js.replace(original, whaleProtector);
    
    // Add the "Hidden Count" indicator at the end of the render block
    // We need to find the end of the donations.forEach block. 
    // It ends around: container.appendChild(card); \n }); \n}
    // Let's replace the end of the function.
    const originalEnd = `        container.appendChild(card);
    });
}`;
    
    const whaleEnd = `        container.appendChild(card);
    });
    
    if (hiddenCount > 0) {
        const indicator = document.createElement('div');
        indicator.className = "p-4 text-center text-silver/60 font-black text-sm uppercase tracking-widest border border-white/5 rounded-xl border-dashed bg-black/20 mt-4 shadow-inner";
        indicator.innerHTML = \`<span class="animate-pulse inline-block mr-2 text-primary">●</span> + \${hiddenCount} more videos in queue... <br><span class="text-[10px] text-silver/40 font-bold normal-case mt-1 block">Process videos to load the next ones.</span>\`;
        container.appendChild(indicator);
    }
}`;

    if (js.includes(originalEnd)) {
        js = js.replace(originalEnd, whaleEnd);
        fs.writeFileSync('whutcha-web/dashboard.js', js);
        console.log('dashboard.js patched for Whale Mode.');
    } else {
        console.log('Could not find end block.');
    }
} else {
    console.log('Already patched.');
}

