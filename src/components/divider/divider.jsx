import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import * as styles from './divider.css';

const Divider = ({className}) => (
    <div className={classNames(styles.divider, className)} />
);

Divider.propTypes = {
    className: PropTypes.string
};

export default Divider;
