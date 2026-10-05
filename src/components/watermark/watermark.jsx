import PropTypes from 'prop-types';
import React from 'react';

import * as styles from './watermark.css';

const Watermark = props => (
    <img
        className={styles.spriteImage}
        loading="lazy"
        src={props.costumeURL}
        draggable={false}
    />
);

Watermark.propTypes = {
    costumeURL: PropTypes.string
};

export default Watermark;
