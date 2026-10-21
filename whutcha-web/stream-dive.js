/**
 * WHUTCHA STREAM DIVE ENGINE (GPU-Accelerated Hyper-Zoom Transition)
 * Adheres strictly to AGENTS.md:
 * - Lens: Vampire Mode (Complete DOM/listener destruction, zero background CPU drain)
 * - Lens: Speedrunner Mode (Instant skip via Tap, Esc, or Space)
 * - Lens: The Stryker Doctrine (Safe storage wrappers, readyState race-condition protection)
 * - Lens: Grandma Mode (Prefers-reduced-motion honor)
 */

(function () {
    // Safe storage helper for Incognito / Safari sandbox mode
    function safeStorage(action, key, val) {
        try {
            if (action === 'get') return sessionStorage.getItem(key);
            if (action === 'set') sessionStorage.setItem(key, val);
            if (action === 'remove') sessionStorage.removeItem(key);
        } catch (e) {
            return null;
        }
    }

    window.triggerStreamDive = function (options = {}) {
        // Respect system reduced-motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (typeof options.onComplete === 'function') options.onComplete();
            return;
        }

        // Avoid showing repeatedly in the same tab session unless explicitly forced
        const hasSeenThisTab = safeStorage('get', 'whutcha_dive_seen');
        if (hasSeenThisTab && !options.force) {
            if (typeof options.onComplete === 'function') options.onComplete();
            return;
        }

        // Mark as seen for this session
        safeStorage('set', 'whutcha_dive_seen', 'true');

        // Check if an existing overlay is already active
        if (document.getElementById('stream-dive-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'stream-dive-overlay';
        overlay.innerHTML = `
            <div class="dive-ambient-glow"></div>
            <div class="dive-skip-badge">[TAP / SPACE TO SKIP]</div>
            
            <div class="dive-rig-stage">
                <div class="dive-monitor-frame cyber-scanlines">
                    <!-- WebCam Diode -->
                    <div style="width: 6px; height: 6px; background: #00f0ff; border-radius: 50%; margin: 0 auto 8px auto; box-shadow: 0 0 8px #00f0ff;"></div>
                    
                    <div class="dive-screen-glass">
                        <!-- Top Stream HUD in Virtual Screen -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 10px; height: 10px; background: #00f0ff; border-radius: 50%; box-shadow: 0 0 10px #00f0ff;"></div>
                                <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: #00f0ff; letter-spacing: 0.15em;">ON AIR // LIVE BROADCAST</span>
                            </div>
                            <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #8b949e;">WHUTCHA v2.6 COCKPIT</span>
                        </div>

                        <!-- Center Stream Pulse Graphic -->
                        <div style="text-align: center; margin: auto 0;">
                            <div style="font-size: 12px; font-family: monospace; color: #8b949e; letter-spacing: 0.3em; margin-bottom: 6px; text-transform: uppercase;">
                                Connecting Studio...
                            </div>
                            <h1 style="font-size: 38px; font-weight: 900; letter-spacing: -0.04em; color: #ffffff; text-shadow: 0 0 30px rgba(0, 240, 255, 0.6); margin: 0;">
                                <span style="color: #00f0ff;">W</span>HUTCHA
                            </h1>
                            
                            <!-- Animated Wave Bar -->
                            <div style="display: flex; justify-content: center; gap: 4px; margin-top: 16px;">
                                <div style="width: 4px; height: 18px; background: #00f0ff; border-radius: 2px;"></div>
                                <div style="width: 4px; height: 32px; background: #00f0ff; border-radius: 2px;"></div>
                                <div style="width: 4px; height: 24px; background: #a800ff; border-radius: 2px;"></div>
                                <div style="width: 4px; height: 42px; background: #a800ff; border-radius: 2px;"></div>
                                <div style="width: 4px; height: 16px; background: #00f0ff; border-radius: 2px;"></div>
                                <div style="width: 4px; height: 28px; background: #00f0ff; border-radius: 2px;"></div>
                            </div>
                        </div>

                        <!-- Bottom Stream Telemetry -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; font-family: monospace; font-size: 10px; color: #8b949e;">
                            <span>BITRATE: <strong style="color: #10b981;">6000 KBPS</strong></span>
                            <span>OBS WEBRTC: <strong style="color: #00f0ff;">ACTIVE</strong></span>
                            <span>STATUS: <strong style="color: #10b981;">READY</strong></span>
                        </div>
                    </div>
                </div>
                
                <!-- Physical Laptop Stand / Desk Light -->
                <div class="dive-laptop-base"></div>
            </div>
        `;

        document.body.appendChild(overlay);

        let isCleanedUp = false;
        function finishDive() {
            if (isCleanedUp) return;
            isCleanedUp = true;

            // Remove keyboard & click listeners
            window.removeEventListener('keydown', handleKey);
            overlay.removeEventListener('click', finishDive);

            // Smooth snappy fade out
            overlay.style.transition = 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
            overlay.style.opacity = '0';

            setTimeout(() => {
                // VAMPIRE MODE: Complete DOM destruction
                overlay.remove();
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }, 150);
        }

        function handleKey(e) {
            if (e.code === 'Space' || e.code === 'Escape' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                finishDive();
            }
        }

        // Speedrunner triggers
        window.addEventListener('keydown', handleKey);
        overlay.addEventListener('click', finishDive);

        // Auto-complete after keyframe animation finishes
        setTimeout(finishDive, 1150);
    };

    // Resilient auto-trigger (The Stryker Doctrine: handles late script injection)
    function autoInit() {
        if (safeStorage('get', 'whutcha_just_logged_in') === 'true') {
            safeStorage('remove', 'whutcha_just_logged_in');
            window.triggerStreamDive({ force: true });
        } else if (!safeStorage('get', 'whutcha_dive_seen')) {
            window.triggerStreamDive();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
})();
