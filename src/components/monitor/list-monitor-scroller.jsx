import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';

import styles from './monitor.css';
import {List} from 'react-virtualized';
import DOMElementRenderer from '../../containers/dom-element-renderer.jsx';

class ListMonitorScroller extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'rowRenderer',
            'noRowsRenderer',
            'handleEventFactory'
        ]);
    }
    handleEventFactory (index) {
        return () => this.props.onActivate(index);
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
        const value = this.props.values[index];
        const isNestedArray = Array.isArray(value);
        const isNestedObject = value?.constructor?.prototype === Object.prototype;
        return (
            <div
                className={styles.listRow}
                key={key}
                style={style}
            >
                <div className={styles.listIndex}>{index + 1 /* one indexed */}</div>
                <div
                    className={styles.listValue}
                    dataIndex={index}
                    style={{
                        background: this.props.categoryColor.background,
                        color: this.props.categoryColor.text
                    }}
                    onClick={this.props.draggable ? this.handleEventFactory(index) : null}
                >
                    {this.props.draggable && this.props.activeIndex === index ? (
                        <div className={styles.inputWrapper}>
                            <input
                                autoFocus
                                autoComplete={false}
                                className={classNames(styles.listInput, 'no-drag')}
                                spellCheck={false}
                                style={{color: this.props.categoryColor.text}}
                                type="text"
                                value={isNestedArray
                                    ? "nested array"
                                    : isNestedObject
                                        ? "nested object"
                                        : String(typeof this.props.activeValue?.customId === 'string' && typeof this.props.activeValue?.toListEditor === 'function'
                                            ? this.props.activeValue.toListEditor()
                                            : this.props.activeValue)}
                                onBlur={this.props.onDeactivate}
                                onChange={this.props.onInput}
                                onFocus={this.props.onFocus}
                                onKeyDown={this.props.onKeyPress} // key down to get ahead of blur
                                readOnly={isNestedArray || isNestedObject}
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
                                ? <i>nested array</i>
                                : isNestedObject
                                    ? <i>nested object</i>
                                    : typeof value?.customId === 'string' && (typeof value?.toListItem === 'function' || typeof value?.toMonitorContent === 'function')
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
        // Keep the active index in view if defined, else must be undefined for List component
        const scrollToIndex = activeIndex === null ? undefined : activeIndex; /* eslint-disable-line no-undefined */
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
    activeIndex: PropTypes.number,
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
    values: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.array,
        PropTypes.object
    ])),
    width: PropTypes.number
};
export default ListMonitorScroller;
