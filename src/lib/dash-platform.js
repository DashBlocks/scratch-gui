/**
 * @fileoverview Cross-platform touch/mobile helpers for Dash.
 *
 * Small, dependency-free utilities used across the GUI:
 * - Device detection (touch, narrow screens)
 * - Haptic feedback via the Vibration API
 * - Wake Lock so the screen stays on while a project runs
 * - PWA install prompt plumbing (beforeinstallprompt)
 * - Service worker registration for the installed/offline shell
 */

import dashSettings from './dash-settings.js';

let dashPlatformInitialized = false;

const isTouch = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);

const isNarrow = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 599px)').matches;

/* ------------------------------------------------------------------ */
/* Haptics                                                             */
/* ------------------------------------------------------------------ */

/**
 * Buzz the device (if it supports vibration) and the setting allows it.
 * Safe to call everywhere: it silently does nothing on desktop.
 * @param {number} ms vibration duration in milliseconds
 */
const buzz = ms => {
    if (!dashSettings.get('haptics')) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(ms);
        } catch (e) {
            // Some browsers require a user gesture — ignore failures.
        }
    }
};

/* ------------------------------------------------------------------ */
/* Wake Lock                                                           */
/* ------------------------------------------------------------------ */

let wakeLock = null;
let wakeLockRequested = false;
let wakeLockListenersBound = false;

const requestWakeLock = async () => {
    if (!dashSettings.get('keepAwake')) return null;
    wakeLockRequested = true;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return null;
    try {
        if (wakeLock) {
            // Drop the previous sentinel so they do not stack.
            try {
                await wakeLock.release();
            } catch (e) {
                // Already released.
            }
            wakeLock = null;
        }
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
            wakeLock = null;
        });
        return wakeLock;
    } catch (e) {
        // Denied or unsupported — the screen may sleep normally.
        return null;
    }
};

const releaseWakeLock = async () => {
    wakeLockRequested = false;
    if (wakeLock) {
        try {
            await wakeLock.release();
        } catch (e) {
            // Already released.
        }
        wakeLock = null;
    }
};

/* ------------------------------------------------------------------ */
/* Install prompt (PWA)                                                */
/* ------------------------------------------------------------------ */

let installPrompt = null;
const installPromptListeners = new Set();

const notifyInstallPrompt = () => {
    for (const listener of installPromptListeners) {
        try {
            listener(installPrompt);
        } catch (e) {
            // Listener errors must not break other listeners.
        }
    }
};

/**
 * Subscribe to PWA install-availability changes.
 * The listener is called immediately with the current state.
 * @param {function(?Event): void} listener receives the prompt event or null
 * @returns {function(): void} unsubscribe function
 */
const onInstallPrompt = listener => {
    installPromptListeners.add(listener);
    listener(installPrompt);
    return () => installPromptListeners.delete(listener);
};

/**
 * Trigger the PWA installation flow if a prompt is available.
 * @returns {Promise<boolean>} true if the install prompt was shown and accepted
 */
const promptInstall = async () => {
    if (!installPrompt) return false;
    try {
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        installPrompt = null;
        notifyInstallPrompt();
        return Boolean(choice && choice.outcome === 'accepted');
    } catch (e) {
        installPrompt = null;
        notifyInstallPrompt();
        return false;
    }
};

/* ------------------------------------------------------------------ */
/* Service worker                                                      */
/* ------------------------------------------------------------------ */

/**
 * Registers the app service worker so the editor shell can be installed
 * and works offline. Failures are silent (unsupported browsers / dev servers).
 * The worker lives next to the manifest, so sub-path deploys work too.
 */
const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator)) return;
    if (typeof window === 'undefined') return;
    window.addEventListener('load', () => {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        const swUrl = manifestLink
            ? String(manifestLink.href).replace(/manifest\.webmanifest(\?.*)?$/, 'sw.js$1')
            : 'sw.js';
        navigator.serviceWorker.register(swUrl).catch(() => {
            // Registration can fail on dev servers or unsupported origins — fine.
        });
    });
};

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

const initDashPlatform = () => {
    if (dashPlatformInitialized) return;
    if (typeof window === 'undefined') return;
    dashPlatformInitialized = true;

    // PWA install prompt.
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        installPrompt = event;
        notifyInstallPrompt();
    });
    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        notifyInstallPrompt();
    });
    registerServiceWorker();

    // Re-acquire the wake lock when the tab becomes visible again.
    if (!wakeLockListenersBound) {
        wakeLockListenersBound = true;
        document.addEventListener('visibilitychange', () => {
            if (wakeLockRequested && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        });
    }
};

// Install eagerly so early user interactions benefit.
initDashPlatform();

export {
    initDashPlatform,
    isTouch,
    isNarrow,
    buzz,
    requestWakeLock,
    releaseWakeLock,
    onInstallPrompt,
    promptInstall,
    registerServiceWorker
};

