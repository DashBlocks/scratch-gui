import React from 'react';
import PropTypes from 'prop-types';
import styles from './monitor.css';
import DOMElementRenderer from '../../containers/dom-element-renderer.jsx';
import Cast from 'scratch-vm/src/util/cast';

const DefaultMonitor = ({categoryColor, label, value}) => (
    <div className={styles.defaultMonitor}>
        <div className={styles.row}>
            <div className={styles.label}>
                {label}
            </div>
            <div
                className={styles.value}
                style={{
                    background: categoryColor.background,
                    color: categoryColor.text
                }}
            >
                {Cast.isCustomType(value) && typeof value?.toMonitorContent === 'function' ?
                    (<DOMElementRenderer domElement={value.toMonitorContent()} />) :
                    String(value)}
            </div>
        </div>
    </div>
);

DefaultMonitor.propTypes = {
    categoryColor: PropTypes.shape({
        background: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    }).isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.any
};

export default DefaultMonitor;
