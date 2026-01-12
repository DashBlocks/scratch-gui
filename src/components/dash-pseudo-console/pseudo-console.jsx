import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants.js';
import {getStageDimensions, getMinWidth} from '../../lib/screen-utils.js';
import styles from './pseudo-console.css';

const PseudoConsoleComponent = props => (
    <Box className={styles.pseudoConsoleWrapper}>
        {props.lines.map((line, i) => (
            <span key={i}>
                {line}
            </span>
        ))}
    </Box>
);

PseudoConsoleComponent.propTypes = {
    lines: PropTypes.arrayOf(PropTypes.string),
    linesCount: PropTypes.number,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    symbols: PropTypes.number
};

export default PseudoConsoleComponent;
