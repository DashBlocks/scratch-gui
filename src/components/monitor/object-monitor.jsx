import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import styles from './monitor.css';
import ObjectMonitorScroller from './object-monitor-scroller.jsx';

const ObjectMonitor = ({draggable, label, width, height, value, path, onNavigateTo, onNavigateDown, onResizeMouseDown, onAdd, ...rowProps}) => (
    <div
        className={styles.listMonitor}
        style={{
            width: `${width}px`,
            height: `${height}px`
        }}
    >
        <div className={styles.listHeader}>
            {label}
        </div>
        {(path?.length || 0) > 0 && (
            <div className={styles.listPath}>
                <span style={{cursor: 'pointer'}} onClick={() => onNavigateTo(0)}>{label}</span>
                {path.map((p, i) => (
                    <span key={i}>
                        <span>/</span>
                        <span style={{cursor: 'pointer'}} onClick={() => onNavigateTo(i + 1)}>{typeof p === 'number' ? p + 1 /* one indexed */ : p}</span>
                    </span>
                ))}
            </div>
        )}
        <div className={styles.listBody}>
            <ObjectMonitorScroller
                draggable={draggable}
                height={height}
                values={value}
                width={width}
                onNavigateDown={onNavigateDown}
                {...rowProps}
            />
        </div>
        <div className={styles.listFooter}>
            <div
                className={classNames(draggable ? styles.addButton : null, 'no-drag')}
                onClick={draggable ? onAdd : null}
            >
                {'+' /* TODO waiting on asset */}
            </div>
            <div className={styles.footerLength}>
                <FormattedMessage
                    defaultMessage="length {length}"
                    description="Length label on list monitors. DO NOT translate {length} (with brackets)."
                    id="gui.monitor.listMonitor.listLength"
                    values={{
                        length: Object.keys(value).length
                    }}
                />
            </div>
            <div
                className={classNames(draggable ? styles.resizeHandle : null, 'no-drag')}
                onTouchStart={draggable ? onResizeMouseDown : null}
                onPointerDown={draggable ? onResizeMouseDown : null}
            >
                {'=' /* TODO waiting on asset */}
            </div>
        </div>
    </div>
);

ObjectMonitor.propTypes = {
    activeIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    categoryColor: PropTypes.shape({
        background: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    }).isRequired,
    draggable: PropTypes.bool.isRequired,
    height: PropTypes.number,
    label: PropTypes.string.isRequired,
    onActivate: PropTypes.func,
    onAdd: PropTypes.func,
    onResizeMouseDown: PropTypes.func,
    path: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    onNavigateTo: PropTypes.func,
    onNavigateDown: PropTypes.func,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.object
        ]))
    ]),
    width: PropTypes.number
};

ObjectMonitor.defaultProps = {
    width: 110,
    height: 200
};

export default ObjectMonitor;
