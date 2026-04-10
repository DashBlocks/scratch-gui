import React from 'react';
import PropTypes from 'prop-types';
import styles from './monitor.css';
import DOMElementRenderer from '../../containers/dom-element-renderer.jsx';
import Cast from 'scratch-vm/src/utils/cast.js';

const LargeMonitor = ({categoryColor, value}) => (
    <div className={styles.largeMonitor}>
        <div
            className={styles.largeValue}
            style={{
                background: categoryColor.background,
                color: categoryColor.text
            }}
        >
            {Cast.isCustomType(value) && typeof value?.toMonitorContent === 'function'
                ? (<DOMElementRenderer domElement={value.toMonitorContent()} />)
                : String(value)}
        </div>
    </div>
);

LargeMonitor.propTypes = {
    categoryColor: PropTypes.shape({
        background: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    }).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ])
};

export default LargeMonitor;
