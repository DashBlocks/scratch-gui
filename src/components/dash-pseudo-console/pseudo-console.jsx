import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import {getStageDimensions, getMinWidth} from '../../lib/screen-utils.js';
import styles from './pseudo-console.css';

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
