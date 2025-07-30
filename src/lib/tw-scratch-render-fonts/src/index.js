// Synchronously load TTF fonts.
// First, have Webpack load their data as Base 64 strings.
let FONTS;

const getFonts = function () {
    if (FONTS) return FONTS;
    /* eslint-disable global-require */
    FONTS = {
        // Scratch
        'Sans Serif': require('base64-loader!./NotoSans-Medium.ttf'),
        'Serif': require('base64-loader!./SourceSerifPro-Regular.otf'),
        'Handwriting': require('base64-loader!./handlee-regular.ttf'),
        'Marker': require('base64-loader!./Knewave.ttf'),
        'Curly': require('base64-loader!./Griffy-Regular.ttf'),
        'Pixel': require('base64-loader!./Grand9K-Pixel.ttf'),
        // Xtraflexidisc is saved as Scratch for backwards-compat, this needs visual renaming
        'Scratch': require('base64-loader!./BLACKBOYSONMOPEDS.ttf'),
        'Branches': require('base64-loader!./Xtraflexidisc.otf'),
        // PenguinMod
        'Technological': require('base64-loader!./MonospaceBold.ttf'),
        'Bubbly': require('base64-loader!./QTKooper.otf'),
        'Bits and Bytes': require('base64-loader!./freecam-v2.ttf'),
        'Playful': require('base64-loader!./BadComic-Regular.ttf'),
        'Arcade': require('base64-loader!./PressStart2P.ttf'),
        'Archivo': require('base64-loader!./Archivo-Regular.ttf'),
        'Archivo Black': require('base64-loader!./Archivo-Black.ttf'),
        // Dash
        'Gogono': require('base64-loader!./gogono-cocoa-mochi-cyrillic.otf'),
        'Just Bubble': require('base64-loader!./JustBubble.ttf'),
        'Lilita One Regular': require('base64-loader!./Lilita One Regular.ttf'),
        'Minecrafter': require('base64-loader!./Minecrafter.Reg.ttf'),
        'Obelix Pro': require('base64-loader!./obelix_pro.ttf'),
        'Jet Brains Mono': require('base64-loader!./JetBrainsMono-Light.ttf')
    };
    /* eslint-enable global-require */

    // For each Base 64 string,
    // 1. Replace each with a usable @font-face tag that points to a Data URI.
    // 2. Inject the font into a style on `document.body`, so measurements
    //    can be accurately taken in SvgRenderer._transformMeasurements.
    for (const fontName in FONTS) {
        const fontData = FONTS[fontName];
        FONTS[fontName] = '@font-face {' +
            `font-family: "${fontName}";src: url("data:application/x-font-ttf;charset=utf-8;base64,${fontData}");}`;
    }

    if (!document.getElementById('scratch-font-styles')) {
    	const documentStyleTag = document.createElement('style');
    	documentStyleTag.id = 'scratch-font-styles';
    	for (const fontName in FONTS) {
    	    documentStyleTag.textContent += FONTS[fontName];
    	}
    	document.body.insertBefore(documentStyleTag, document.body.firstChild);
    }

    return FONTS;
}

const loadFonts = function () {
    return Promise.resolve(getFonts());
};

module.exports = getFonts;
module.exports.loadFonts = loadFonts;