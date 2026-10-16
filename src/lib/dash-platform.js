/**
 * Platform helpers for touch devices and small screens.
 * Keeps <html> classes (dash-touch, dash-narrow) in sync with the device,
 * provides haptic feedback and tracks the on-screen keyboard height.
 */

const NARROW_QUERY = '(max-width: 1023px)';
const COARSE_QUERY = '(pointer: coarse)';

let initialized = false;
let keyboardHeight = 0;

const isTouch = () => {
    if (typeof window === 'undefined') return false;
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
    return typeof window.matchMedia === 'function' && window.matchMedia(COARSE_QUERY).matches;
};

const isNarrow = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia(NARROW_QUERY).matches;

const updateClasses = () => {
    const root = document.documentElement;
    root.classList.toggle('dash-touch', isTouch());
    root.classList.toggle('dash-narrow', isNarrow());
};

/**
 * Short haptic feedback where the platform supports it (no-op elsewhere).
 * @param {number|number[]} pattern vibration pattern in milliseconds
 */
const buzz = pattern => {
    if (!isTouch()) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try {
        navigator.vibrate(pattern);
    } catch (error) {
        // Vibration may require a user gesture; ignore failures.
    }
};

const handleViewportChange = () => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    // Space the visual viewport lost to the on-screen keyboard.
    const overlap = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    const height = overlap > 120 ? overlap : 0;
    if (height === keyboardHeight) return;
    keyboardHeight = height;
    const root = document.documentElement;
    root.style.setProperty('--dash-keyboard-height', `${height}px`);
    root.classList.toggle('dash-keyboard-open', height > 0);
};

/**
 * Start listening for platform changes. Safe to call more than once.
 */
const initDashPlatform = () => {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;
    updateClasses();
    if (typeof window.matchMedia === 'function') {
        for (const query of [NARROW_QUERY, COARSE_QUERY]) {
            const media = window.matchMedia(query);
            if (typeof media.addEventListener === 'function') {
                media.addEventListener('change', updateClasses);
            }
        }
    }
    window.addEventListener('resize', updateClasses);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
        handleViewportChange();
    }
};

initDashPlatform();

export {initDashPlatform, isTouch, isNarrow, buzz};
