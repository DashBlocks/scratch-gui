import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {getEventXY} from '../lib/touch-utils';
import {getVariableValue, setVariableValue} from '../lib/variable-utils';
import ObjectMonitorComponent from '../components/monitor/object-monitor.jsx';
import {Map} from 'immutable';
import Prompt from './prompt.jsx';

const messages = defineMessages({
    newItemTitle: {
        defaultMessage: 'New Item',
        description: 'Title for the prompt used to add a new item to an object monitor',
        id: 'dash.objectMonitor.newItemTitle'
    },
    newItemLabel: {
        defaultMessage: 'Enter key for new item in object.',
        description: 'Label for the prompt used to add a new item to an object monitor',
        id: 'dash.objectMonitor.newItemLabel'
    },
    keyAlreadyExists: {
        defaultMessage: 'Value with the key {key} already exists!',
        description: 'Alert shown when trying to add a duplicate key to an object monitor',
        id: 'dash.objectMonitor.keyAlreadyExists'
    }
});

class ObjectMonitor extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleActivate',
            'handleDeactivate',
            'handleInput',
            'handleRemove',
            'handleKeyPress',
            'handleFocus',
            'handleAdd',
            'handleOk',
            'handleCancel',
            'handleResizeMouseDown',
            'handleNavigateDown',
            'handleNavigateTo'
        ]);

        this.state = {
            prompt: false,
            draggable: true,
            activeIndex: null,
            activeValue: null,
            width: props.width || 100,
            height: props.height || 200,
            path: []
        };
    }

    getCurrentList() {
        let current = this.props.value;
        for (const key of this.state.path) {
            if (current && typeof current === 'object') {
                current = current[key];
            } else {
                return [];
            }
        }
        return current || [];
    }

    applyDeepUpdate(callback) {
        const {vm, targetId, id: variableId} = this.props;
        const rootValue = getVariableValue(vm, targetId, variableId);

        if (this.state.path.length === 0) {
            const newValue = callback(rootValue);
            setVariableValue(vm, targetId, variableId, newValue);
            return;
        }

        const newRoot = Array.isArray(rootValue) ? [...rootValue] : {...rootValue};
        let current = newRoot;
        let parent = null;
        let lastKey = null;

        for (let i = 0; i < this.state.path.length; i++) {
            parent = current;
            lastKey = this.state.path[i];
            parent[lastKey] = Array.isArray(parent[lastKey]) ? [...parent[lastKey]] : {...parent[lastKey]};
            current = parent[lastKey];
        }

        parent[lastKey] = callback(current);
        setVariableValue(vm, targetId, variableId, newRoot);
    }

    handleNavigateDown (key) {
        this.handleDeactivate();
        this.setState({
            path: [...this.state.path, key],
            activeIndex: null,
            activeValue: null
        });
    }

        handleNavigateTo (depth) {
        this.handleDeactivate();
        this.setState({
            path: this.state.path.slice(0, depth),
            activeIndex: null,
            activeValue: null
        });
    }

    handleActivate (indexOrKey) {
        // Do nothing if activating the currently active item
        if (this.state.activeIndex === indexOrKey) {
            return;
        }
        let currentList = this.getCurrentList();
        this.setState({
            activeIndex: indexOrKey,
            activeValue: currentList[indexOrKey]
        });
    }

    handleDeactivate () {
        // Submit any in-progress value edits on blur
        if (this.state.activeIndex !== null) {
            this.applyDeepUpdate(list => {
                const newList = Array.isArray(list) ? [...list] : {...list};
                newList[this.state.activeIndex] = this.state.activeValue;
                return newList;
            });
            this.setState({activeIndex: null, activeValue: null});
        }
    }

    handleFocus (e) {
        // Select all the text in the input when it is focused and prompt is not opened.
        if (!this.state.prompt) e.target.select();
    }

    handleKeyPress (e) {
        // Special case for tab, arrow keys and enter.
        // Tab / shift+tab navigate down / up the list.
        // Arrow down / arrow up navigate down / up the list.
        // Enter / shift+enter insert new blank item below / above.
        const previouslyActiveIndex = this.state.activeIndex;
        const currentList = this.getCurrentList();
        const currentKeys = Array.isArray(currentList) ? currentList.map((_, i) => i) : Object.keys(currentList);
        const activePos = currentKeys.indexOf(previouslyActiveIndex);

        let navigateDirection = 0;
        if (e.key === 'Tab') navigateDirection = e.shiftKey ? -1 : 1;
        else if (e.key === 'ArrowUp') navigateDirection = -1;
        else if (e.key === 'ArrowDown') navigateDirection = 1;
        if (navigateDirection) {
            this.handleDeactivate(); // Submit in-progress edits
            const newPos = this.wrapListIndex(activePos + navigateDirection, currentKeys.length);
            const newKey = currentKeys[newPos];
            this.setState({
                activeIndex: newKey,
                activeValue: currentList[newKey]
            });
            e.preventDefault(); // Stop default tab behavior, handled by this state change
        } else if (e.key === 'Enter') {
            this.handleDeactivate();
            if (Array.isArray(currentList)) {
                this.applyDeepUpdate(list => {
                    const newListItemValue = '';
                    const newValueOffset = e.shiftKey ? 0 : 1;
                    const newListValue = list.slice(0, previouslyActiveIndex + newValueOffset)
                        .concat([newListItemValue])
                        .concat(list.slice(previouslyActiveIndex + newValueOffset));
                    
                    const newIndex = this.wrapListIndex(previouslyActiveIndex + newValueOffset, newListValue.length);
                    this.setState({
                        activeIndex: newIndex,
                        activeValue: newListItemValue
                    });
                    return newListValue;
                });
            }
        }
    }

    handleInput (e) {
        this.setState({activeValue: e.target.value});
    }

    handleRemove (e) {
        e.preventDefault(); // Default would blur input, prevent that.
        e.stopPropagation(); // Bubbling would activate, which will be handled here
        this.applyDeepUpdate(list => {
            if (Array.isArray(list)) {
                const newListValue = list.slice(0, this.state.activeIndex)
                    .concat(list.slice(this.state.activeIndex + 1));
                const newActiveIndex = Math.min(newListValue.length - 1, this.state.activeIndex);
                this.setState({
                    activeIndex: newActiveIndex,
                    activeValue: newListValue[newActiveIndex]
                });
                return newListValue;
            } else {
                const newListValue = {...list};
                delete newListValue[this.state.activeIndex];
                this.setState({ activeIndex: null, activeValue: null });
                return newListValue;
            }
        });
    }

    handleAdd () {
        const currentList = this.getCurrentList();
        if (Array.isArray(currentList)) {
            this.applyDeepUpdate(list => {
                const newListValue = list.concat(['']);
                this.setState({activeIndex: newListValue.length - 1, activeValue: ''});
                return newListValue;
            });
            return;
        }

        this.setState({
            prompt: true,
            draggable: false
        });
    }

    handleOk (key) {
        if (!key) {
            this.setState({prompt: false, draggable: true});
            return;
        }

        this.applyDeepUpdate(list => {
            if (!list || typeof list !== 'object' || Array.isArray(list)) {
                return list;
            }

            if (Object.keys(list).includes(key)) {
                alert(this.props.intl.formatMessage(messages.keyAlreadyExists, {key}));
                this.setState({prompt: false, draggable: true});
                return list;
            }

            const newObjectValue = {...list, [key]: ''};
            this.setState({activeIndex: key, activeValue: '', prompt: false, draggable: true});
            return newObjectValue;
        });
    }

    handleCancel () {
        this.setState({prompt: false, draggable: true});
    }

    handleResizeMouseDown (e) {
        this.initialPosition = getEventXY(e);
        this.initialWidth = this.state.width;
        this.initialHeight = this.state.height;
        const onPointerMove = ev => {
            const newPosition = getEventXY(ev);
            const dx = newPosition.x - this.initialPosition.x;
            const dy = newPosition.y - this.initialPosition.y;
            this.setState({
                width: Math.max(Math.min(this.initialWidth + dx, this.props.customStageSize.width), 100),
                height: Math.max(Math.min(this.initialHeight + dy, this.props.customStageSize.height), 60)
            });
        };

        const onPointerUp = ev => {
            onPointerMove(ev); // Make sure width/height are up-to-date
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            this.props.vm.runtime.requestUpdateMonitor(Map({
                id: this.props.id,
                height: this.state.height,
                width: this.state.width
            }));
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

    }

    wrapListIndex (index, length) {
        return (index + length) % length;
    }

    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            ...props
        } = this.props;

        let currentList = this.getCurrentList();
        let isObj = currentList && typeof currentList === 'object' && !Array.isArray(currentList);
        let resolvedValues = [];

        if (isObj) {
            resolvedValues = Object.entries(currentList).map(([k, v]) => ({ __isObjEntry: true, key: k, value: v }));
        } else if (Array.isArray(currentList)) {
            resolvedValues = currentList;
        }
        return (
            <>
                {this.state.prompt && (
                    <Prompt
                        title={this.props.intl.formatMessage(messages.newItemTitle)}
                        label={this.props.intl.formatMessage(messages.newItemLabel)}
                        defaultValue="key"
                        onOk={this.handleOk}
                        onCancel={this.handleCancel}
                        showVariableOptions={false}
                        showCloudOption={false}
                        showListMessage={false}
                        isStage={false}
                        vm={vm}
                    />
                )}
                <ObjectMonitorComponent
                    {...props}
                    value={resolvedValues}
                    path={this.state.path}
                    activeIndex={this.state.activeIndex}
                    activeValue={this.state.activeValue}
                    height={this.state.height}
                    width={this.state.width}
                    onActivate={this.handleActivate}
                    onAdd={this.handleAdd}
                    onDeactivate={this.handleDeactivate}
                    onFocus={this.handleFocus}
                    onInput={this.handleInput}
                    onKeyPress={this.handleKeyPress}
                    onRemove={this.handleRemove}
                    onResizeMouseDown={this.handleResizeMouseDown}
                    draggable={this.state.draggable}
                    onNavigateDown={this.handleNavigateDown}
                    onNavigateTo={this.handleNavigateTo}
                />
            </>
        );
    }
}

ObjectMonitor.propTypes = {
    height: PropTypes.number,
    id: PropTypes.string,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    targetId: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
        PropTypes.array,
        PropTypes.object
    ]),
    intl: intlShape,
    vm: PropTypes.instanceOf(VM),
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    vm: state.scratchGui.vm
});

export default injectIntl(connect(mapStateToProps)(ObjectMonitor));
