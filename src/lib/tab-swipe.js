/**
 * Swipe left/right handlers for switching editor tabs on touch screens.
 * Horizontal swipes switch tabs; near-vertical swipes are left alone so the
 * tab bar can still be scrolled past by page scrolling.
 */

const SWIPE_MIN_DX = 40;
const SWIPE_MAX_DY = 30;

/**
 * @param {object} callbacks - {onSwipeLeft, onSwipeRight} called for a completed swipe
 * @returns {object} touch handler props to spread onto a component
 */
const tabSwipeHandlers = callbacks => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    return {
        onTouchStart: event => {
            if (event.touches.length !== 1) {
                tracking = false;
                return;
            }
            const touch = event.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            tracking = true;
        },
        onTouchEnd: event => {
            if (!tracking || !event.changedTouches.length) return;
            tracking = false;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (Math.abs(dx) < SWIPE_MIN_DX || Math.abs(dy) > SWIPE_MAX_DY) return;
            if (dx < 0) {
                callbacks.onSwipeLeft();
            } else {
                callbacks.onSwipeRight();
            }
        }
    };
};

export default tabSwipeHandlers;
