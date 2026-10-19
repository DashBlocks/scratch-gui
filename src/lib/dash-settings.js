/**
 * Small persistent settings for the touch/mobile experience.
 * Stored in localStorage; subscribers are notified on every change.
 */

const STORAGE_KEY = 'dash-mobile-settings';

const DEFAULTS = {
    haptics: true,
    keepAwake: true,
    compact: false
};

const listeners = new Set();
let values = {...DEFAULTS};
let loaded = false;

const load = () => {
    if (loaded || typeof localStorage === 'undefined') return;
    loaded = true;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) values = {...DEFAULTS, ...JSON.parse(raw)};
    } catch (error) {
        values = {...DEFAULTS};
    }
};

const notify = () => {
    for (const listener of [...listeners]) listener(values);
};

const dashSettings = {
    /**
     * @param {string} key setting name
     * @returns {*} current value
     */
    get (key) {
        load();
        return values[key];
    },
    /**
     * @param {string} key setting name
     * @param {*} value new value
     */
    set (key, value) {
        load();
        if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return;
        values = {...values, [key]: value};
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
            } catch (error) {
                // Settings are optional; ignore quota/private-mode errors.
            }
        }
        notify();
    },
    all () {
        load();
        return {...values};
    },
    subscribe (listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};

export default dashSettings;
