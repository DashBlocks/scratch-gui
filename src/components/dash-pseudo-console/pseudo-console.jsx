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
            fontSize: props.stageSize.height / props.linesCount,
            lineHeight: props.stageSize.height / props.linesCount
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
    lines: PropTypes.arrayOf(PropTypes.string),
    linesCount: PropTypes.number,
    stageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        widthDefault: PropTypes.number,
        heightDefault: PropTypes.number
    }).isRequired,
    symbols: PropTypes.number
};

export default PseudoConsoleComponent;
