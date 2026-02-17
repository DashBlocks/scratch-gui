import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import {getStageDimensions, getMinWidth} from '../../lib/screen-utils.js';
import styles from './pseudo-console.css';

const escCodeMatch = /\x1B\[[0-9;]+m/g; // Partly support for "Graphic Mode" ESC codes
const escCodeValid = /\x1B\[\d+(;\d+)*m/;
const colors = {
    30: 'rgb(0, 0, 0)', // Black
    31: 'rgb(196, 0, 0)', // Red
    32: 'rgb(0, 128, 0)', // Green
    33: 'rgb(128, 128, 0)', // Yellow
    34: 'rgb(0, 0, 128)', // Blue
    35: 'rgb(128, 0, 128)', // Magenta
    36: 'rgb(0, 128, 128)', // Cyan
    37: 'rgb(192, 192, 192)', // Light gray
    90: 'rgb(128, 128, 128)', // Gray
    91: 'rgb(255, 0, 0)', // Bright red
    92: 'rgb(0, 255, 0)', // Bright green
    93: 'rgb(255, 255, 0)', // Bright yellow
    94: 'rgb(0, 0, 255)', // Bright blue
    95: 'rgb(255, 0, 255)', // Bright magenta
    96: 'rgb(0, 255, 255)', // Bright cyan
    97: 'rgb(255, 255, 255)' // White
};
const styleByEscCode = (escCode, style) => {
    const params = escCode.match(/\d+/g);
    switch (params[0]) {
    // Styles
    case '0': return {};
    case '1': return {...style, fontWeight: 'bold'};
    case '3': return {...style, fontStyle: 'italic'};
    case '4': return {...style, textDecoration: (style.textDecoration ? style.textDecoration.split(' ') : []).toSpliced(0, 0, 'underline').join(' ')};
    case '8': return {...style, opacity: 0};
    case '9': return {...style, textDecoration: (style.textDecoration ? style.textDecoration.split(' ') : []).toSpliced(0, 0, 'line-through').join(' ')};

    // Reseting styles
    case '22': return {...style, fontWeight: null};
    case '23': return {...style, fontStyle: null};
    case '24': return {...style, textDecoration: (style.textDecoration ? style.textDecoration.split(' ') : []).filter((v) => v !== 'underline').join('')};
    case '28': return {...style, opacity: null};
    case '29': return {...style, textDecoration: (style.textDecoration ? style.textDecoration.split(' ') : []).filter((v) => v !== 'line-through').join('')};

    // Non-table colors
    case '38':
    case '48': {
        const styleName = params[0] === '38' ? 'color' : 'backgroundColor';
        if (params[1] === '2') {
            if (
                0 <= +params[2] && +params[2] <= 255 &&
                0 <= +params[3] && +params[3] <= 255 &&
                0 <= +params[4] && +params[4] <= 255
            ) return {...style, [styleName]: `rgb(${params[2]}, ${params[3]}, ${params[4]})`};
        }
        if (params[1] === '5') {
            if (0 <= +params[2] && +params[2] <= 7) return {...style, [styleName]: colors[+params[2] + 30]};
            if (8 <= +params[2] && +params[2] <= 15) return {...style, [styleName]: colors[+params[2] + 82]};
            if (16 <= +params[2] && +params[2] <= 231) {
                let id = +params[2] - 16, r, g, b;
                r = Math.min(5, Math.floor(id / 36));
                g = Math.min(5, Math.floor((id - r * 36) / 6));
                b = id % 6;
                return {...style, [styleName]: `rgb(${r * 255 / 5}, ${g * 255 / 5}, ${b * 255 / 5})`};
            }
            if (232 <= +params[2] && +params[2] <= 255) {
                const grayscale = (+params[2] - 232) * 255 / 24;
                return {...style, [styleName]: `rgb(${grayscale}, ${grayscale}, ${grayscale})`};
            }
        }
    }

    default: {
        if (
            // Foreground colors
            (30 <= +params[0] && +params[0] <= 37) ||
            (90 <= +params[0] && +params[0] <= 97)
        ) return {...style, color: colors[params[0]]};
        if (
            // Background colors
            (40 <= +params[0] && +params[0] <= 47) ||
            (100 <= +params[0] && +params[0] <= 107)
        ) return {...style, backgroundColor: colors[+params[0] - 10]};
        return style;
    }
    }
};

const PseudoConsoleComponent = props => (
    <Box 
        className={styles.pseudoConsoleWrapper}
        style={{
            height: props.stageSize.height,
            width: props.stageSize.width,
            fontSize: props.stageSize.height / props.shownLinesCount,
            lineHeight: `${props.stageSize.height / props.shownLinesCount}px`
        }}
    >
        {props.lines.map((line, i) => (
            <span key={i}>
                {line}
            </span>
        ))}
    </Box>
);

PseudoConsoleComponent.propTypes = {
    cursor: PropTypes.shape({
        row: PropTypes.number,
        symbol: PropTypes.number
    }).isRequired,
    lines: PropTypes.arrayOf(PropTypes.string),
    linesCount: PropTypes.number,
    shownLinesCount: PropTypes.number,
    stageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        widthDefault: PropTypes.number,
        heightDefault: PropTypes.number
    }).isRequired
};

export default PseudoConsoleComponent;
