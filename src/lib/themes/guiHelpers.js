import {Theme} from '.';
import AddonHooks from '../../addons/hooks';
import './global-styles.css';

const BLOCK_COLOR_NAMES = [
    // Corresponds to the name of the object in blockColors
    'motion',
    'looks',
    'sounds',
    'control',
    'event',
    'sensing',
    'pen',
    'operators',
    'data',
    'data_lists',
    'json',
    'console',
    'more',
    'addons'
];

/**
 * @param {string} css CSS color or var(--...)
 * @param {string} noVar Return CSS color of returned var(--...)
 * @returns {string} evaluated CSS
 */
const evaluateCSS = (css, noVar) => {
    let variableMatch = css.match(/^var\(([\w-]+)\)$/);
    for (let i = 0; (i === 0 || noVar) && variableMatch; i++) {
        css = document.documentElement.style.getPropertyValue(variableMatch[1]);
        variableMatch = css.match(/^var\(([\w-]+)\)$/);
    }
    return css;
};

/**
 * @param {Theme} theme the theme
 */
const applyGuiColors = theme => {
    const doc = document.documentElement;

    const defaultGuiColors = Theme.light.getGuiColors();
    for (const [name, value] of Object.entries(defaultGuiColors)) {
        doc.style.setProperty(`--${name}-default`, value);
    }

    const guiColors = theme.getGuiColors();
    const anyUsesCustom = Object.values(guiColors).some(v => typeof v === 'string' && v.indexOf('--dash-accent-custom') !== -1);
    if (anyUsesCustom) {
        let base = document.documentElement.style.getPropertyValue('--dash-accent-custom');
        if (!base) {
            try {
                base = localStorage.getItem('dash:accent_custom_color');
            } catch (e) {
                base = null;
            }
        }

        const parseHex = hex => {
            if (hex.startsWith('#')) {
                const h = hex.slice(1);
                if (h.length === 3) {
                    return {
                        r: parseInt(h[0] + h[0], 16),
                        g: parseInt(h[1] + h[1], 16),
                        b: parseInt(h[2] + h[2], 16),
                        a: 1
                    };
                }
                if (h.length === 6) {
                    return {
                        r: parseInt(h.slice(0, 2), 16),
                        g: parseInt(h.slice(2, 4), 16),
                        b: parseInt(h.slice(4, 6), 16),
                        a: 1
                    };
                }
            }
            return null;
        };

        const parseRgbString = s => {
            const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
            if (m) {
                return {r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] ? Number(m[4]) : 1};
            }
            return null;
        };

        const rgbToHsl = ({r, g, b}) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b); const min = Math.min(r, g, b);
            let h; let s; const l = (max + min) / 2;
            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return {h: h * 360, s: s * 100, l: l * 100};
        };

        const hslToString = ({h, s, l, a}) => {
            if (typeof a === 'number' && a < 1) return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
            return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
        };

        const rgbaString = ({r, g, b, a}) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;

        let rgb = null;
        if (base) base = base.trim();
        if (base) {
            rgb = parseHex(base) || parseRgbString(base);
        }

        if (rgb) {
            const hsl = rgbToHsl(rgb);
            const darkL = Math.max(0, hsl.l * 0.85);
            const lightL = Math.min(100, hsl.l * 1.15);

            doc.style.setProperty('--dash-accent-custom-transparent', rgbaString({...rgb, a: 0.35}));
            doc.style.setProperty('--dash-accent-custom-light-transparent', rgbaString({...rgb, a: 0.15}));
            doc.style.setProperty('--dash-accent-custom-dark', hslToString({...hsl, l: darkL}));
            doc.style.setProperty('--dash-accent-custom-motion-primary-transparent', rgbaString({...rgb, a: 0.9}));
            doc.style.setProperty('--dash-accent-custom-extensions-primary', hslToString({...hsl, l: Math.min(100, hsl.l + 10)}));
            doc.style.setProperty('--dash-accent-custom-extensions-tertiary', hslToString({...hsl, l: Math.max(0, hsl.l - 10)}));
            doc.style.setProperty('--dash-accent-custom-extensions-transparent', rgbaString({...rgb, a: 0.35}));
            doc.style.setProperty('--dash-accent-custom-extensions-light', hslToString({...hsl, l: Math.min(100, hsl.l + 30)}));
            doc.style.setProperty('--dash-accent-custom-drop-highlight', rgbaString({...rgb, a: 0.5}));
        }
    }
    for (const [name, value] of Object.entries(guiColors)) {
        doc.style.setProperty(`--${name}`, value);
    }

    const blockColors = theme.getBlockColors();
    doc.style.setProperty('--editorTheme3-blockText', blockColors.text);
    doc.style.setProperty('--editorTheme3-inputColor', blockColors.textField);
    doc.style.setProperty('--editorTheme3-inputColor-text', blockColors.textFieldText);
    for (const color of BLOCK_COLOR_NAMES) {
        doc.style.setProperty(`--editorTheme3-${color}-primary`, blockColors[color].primary);
        doc.style.setProperty(`--editorTheme3-${color}-secondary`, blockColors[color].secondary);
        doc.style.setProperty(`--editorTheme3-${color}-tertiary`, blockColors[color].tertiary);
        doc.style.setProperty(`--editorTheme3-${color}-field-background`, blockColors[color].quaternary);
    }

    // Some browsers will color their interfaces to match theme-color, so if we make it the same color as our
    // menu bar, it'll look pretty cool.
    let metaThemeColor = document.head.querySelector('meta[name=theme-color]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', evaluateCSS(guiColors['menu-bar-background'], true));

    // a horrible hack for icons...
    window.Recolor = {
        primary: evaluateCSS(guiColors['looks-secondary'])
    };
    AddonHooks.recolorCallbacks.forEach(i => i());

    // Not a GUI color, but we apply it here anyway lol
    const fontFace = new FontFace('customFont', `url(${theme.font.font})`);
    fontFace.load().then(loadedFont => {
        document.fonts.add(loadedFont);
        document.body.style.fontFamily = 'customFont, "Helvetica Neue", Helvetica, sans-serif';
    })
        .catch(console.error);
};

export {
    applyGuiColors
};
