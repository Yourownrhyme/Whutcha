/**
 * ============================================================================
 * 👁️‍🗨️ WHUTCHA SOVEREIGN IP & ASSET ARMOR
 * Protects UI assets, video canvases, and broadcast streams from cloning & ripping
 * ============================================================================
 */
(function() {
    'use strict';

    // 1. Prevent Dragging Media & Assets (Canvas, Video, Images, SVGs)
    window.addEventListener('dragstart', function(e) {
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
        if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || tag === 'SVG' || (e.target.closest && e.target.closest('canvas, video, img'))) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });

    // 2. Prevent Context Menu on Canvases, Video Feeds, and Brand Logos
    window.addEventListener('contextmenu', function(e) {
        if (!e.target) return;
        if (e.target.closest && e.target.closest('canvas, video, .brand-logo, #whutcha-sound-deck-card, #cam-preview, .seed-shield-chassis, .mascot-avatar')) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });

    // 3. Sovereign DevTools Notice (Deterrent for script-kiddies and casual inspect-element copycats)
    try {
        var isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isDev) {
            console.log(
                '%c👁️‍🗨️ WHUTCHA PROTOCOL // SOVEREIGN BROADCAST CORE\n%cAll live video streams, WebRTC bridges, and transactions are cryptographically verified.\nReverse engineering, automated scraping, or asset tampering is strictly monitored.',
                'color: #00f0ff; font-size: 14px; font-weight: bold; font-family: monospace;',
                'color: #94a3b8; font-size: 11px; font-family: monospace;'
            );
        }
    } catch (_) {}
})();
