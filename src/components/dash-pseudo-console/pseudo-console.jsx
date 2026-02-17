import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import {getStageDimensions, getMinWidth} from '../../lib/screen-utils.js';
import styles from './pseudo-console.css';

const escCodeMatch = /\x1B\[[0-9;]+m/g; // Partly support for "Graphic Mode" ESC codes
const escCodeValid = /\x1B\[\d+(;\d+)*m/;
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
    case '28': return {...style, opacity: 0};
    case '29': return {...style, textDecoration: (style.textDecoration ? style.textDecoration.split(' ') : []).filter((v) => v !== 'line-through').join('')};
    default: return style;
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
