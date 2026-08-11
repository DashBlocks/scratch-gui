import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';

import styles from './monitor.css';
import {List} from 'react-virtualized';
import DOMElementRenderer from '../../containers/dom-element-renderer.jsx';
import Cast from 'scratch-vm/src/util/cast';

class ListMonitorScroller extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'rowRenderer',
            'noRowsRenderer'
        ]);
    }    
    noRowsRenderer () {
        return (
            <div className={classNames(styles.listRow, styles.listEmpty)}>
                <FormattedMessage
                    defaultMessage="(empty)"
                    description="Text shown on a list monitor when a list is empty"
                    id="gui.monitor.listMonitor.empty"
                />
            </div>
        );
    }
    rowRenderer ({index, key, style}) {
        /**
         * The implementation of array monitors was taken from AmpMod
         * codeberg.org/ampmod/ampmod/src/commit/f42bfaeef67ac443b1679fb56b9d54f2a97c4d4f/packages/gui/src/components/monitor/list-monitor-scroller.jsx
         */
        let rawValue = this.props.values[index];
        let isObjEntry = rawValue && typeof rawValue === 'object' && rawValue.__isObjEntry;
        
        let valKey = isObjEntry ? rawValue.key : index;
        let value = isObjEntry ? rawValue.value : rawValue;

        const isNestedArray = Cast.isNormalArray(value);
        const isNestedObject = Cast.isNormalObject(value);
        return (
            <div
                className={styles.listRow}
                key={key}
                style={style}
            >
                <div className={styles.listIndex}>{isObjEntry ? valKey : index + 1 /* one indexed */}</div>
                <div
                    className={styles.listValue}
                    dataIndex={index}
                    style={{
                        background: this.props.categoryColor.background,
                        color: this.props.categoryColor.text,
                        cursor: (isNestedArray || isNestedObject) ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                        if (isNestedArray || isNestedObject) {
                            this.props.onNavigateDown(valKey);
                        } else if (this.props.draggable) {
                            this.props.onActivate(valKey);
                        }
                    }}
                >
                    {this.props.draggable && this.props.activeIndex === valKey ? (
                        <div className={styles.inputWrapper}>
                            <input
                                autoFocus
                                autoComplete={false}
                                className={classNames(styles.listInput, 'no-drag')}
                                spellCheck={false}
                                style={{color: this.props.categoryColor.text}}
                                type="text"
                                value={String(
                                    (isNestedArray || isNestedObject || Cast.isCustomType(value)) &&
                                        typeof this.props.activeValue?.toListEditor === 'function'
                                        ? this.props.activeValue.toListEditor()
                                        : this.props.activeValue
                                )}
                                onBlur={this.props.onDeactivate}
                                onChange={this.props.onInput}
                                onFocus={this.props.onFocus}
                                onKeyDown={this.props.onKeyPress} // key down to get ahead of blur
                                readOnly={isNestedArray || isNestedObject || Cast.isCustomType(value)}
                            />
                            <div
                                className={styles.removeButton}
                                onMouseDown={this.props.onRemove} // mousedown to get ahead of blur
                            >
                                {'✖︎'}
                            </div>
                        </div>

                    ) : (
                        <div className={styles.valueInner}>
                            {isNestedArray
                                ? <i>{`Array(${value.length})`}</i>
                                : isNestedObject
                                    ? <i>{`Object(${value.size})`}</i>
                                    : Cast.isCustomType(value) && (typeof value?.toListItem === 'function' || typeof value?.toMonitorContent === 'function')
                                        ? (<DOMElementRenderer domElement={typeof value?.toListItem === 'function'
                                            ? value.toListItem()
                                            : value.toMonitorContent()} />)
                                        : String(value)}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    render () {
        const {height, values, width, activeIndex, activeValue} = this.props;
        const listHeight = Math.max(0, (Number.isFinite(height) ? height : 0) - 42);
        const safeValues = values || [];
        const rowCount = Array.isArray(safeValues) ? safeValues.length : Object.keys(safeValues).length;
        let scrollToIndex;
        // Keep the active index in view if defined, else must be undefined for List component
        if (activeIndex === null || rowCount === 0) {
            scrollToIndex = undefined;
        } else if (typeof activeIndex === 'number') {
            scrollToIndex = (Number.isFinite(activeIndex) && activeIndex >= 0 && activeIndex < rowCount)
                ? Math.floor(activeIndex)
                : undefined;
        } else if (typeof activeIndex === 'string') {
            if (Array.isArray(safeValues)) {
                const found = safeValues.findIndex(v => v && v.__isObjEntry && String(v.key) === String(activeIndex));
                if (found !== -1) {
                    scrollToIndex = found;
                } else {
                    const number = Number(activeIndex);
                    scrollToIndex = (Number.isFinite(number) && number >= 0 && number < rowCount) ? number : undefined;
                }
            } else {
                const foundIndex = Object.keys(safeValues).indexOf(String(activeIndex));
                scrollToIndex = foundIndex === -1 ? undefined : foundIndex;
            }
        } else {
            scrollToIndex = undefined;
        }
        return (
            <List
                activeIndex={activeIndex}
                activeValue={activeValue}
                height={(height) - 42 /* Header/footer size, approx */}
                noRowsRenderer={this.noRowsRenderer}
                rowCount={values.length}
                rowHeight={24 /* Row size is same for all rows */}
                rowRenderer={this.rowRenderer}
                scrollToIndex={scrollToIndex} /* eslint-disable-line no-undefined */
                values={values}
                width={width}
            />
        );
    }
}

ListMonitorScroller.propTypes = {
    activeIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    activeValue: PropTypes.string,
    categoryColor: PropTypes.shape({
        background: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
    }).isRequired,
    draggable: PropTypes.bool,
    height: PropTypes.number,
    onActivate: PropTypes.func,
    onDeactivate: PropTypes.func,
    onFocus: PropTypes.func,
    onInput: PropTypes.func,
    onKeyPress: PropTypes.func,
    onRemove: PropTypes.func,
    onNavigateDown: PropTypes.func,
    values: PropTypes.any,
    width: PropTypes.number
};
export default ListMonitorScroller;
