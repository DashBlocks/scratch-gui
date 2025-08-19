import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {getEventXY} from '../lib/touch-utils';
import {getVariableValue, setVariableValue} from '../lib/variable-utils';
import ObjectMonitorComponent from '../components/monitor/object-monitor.jsx';
import {Map} from 'immutable';

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
            'handleResizeMouseDown'
        ]);

        this.state = {
            activeIndex: null,
            activeValue: null,
            width: props.width || 100,
            height: props.height || 200
        };
    }

    handleActivate (index) {
        // Do nothing if activating the currently active item
        if (this.state.activeIndex === index) {
            return;
        }

        this.setState({
            activeIndex: index,
            activeValue: Object.values(this.props.value)[index]
        });
    }

    handleDeactivate () {
        // Submit any in-progress value edits on blur
        if (this.state.activeIndex !== null) {
            const {vm, targetId, id: variableId} = this.props;
            const newObjectValue = getVariableValue(vm, targetId, variableId);
            newObjectValue[Object.keys(newObjectValue)[this.state.activeIndex]] = this.state.activeValue;
            setVariableValue(vm, targetId, variableId, newObjectValue);
            this.setState({activeIndex: null, activeValue: null});
        }
    }

    handleFocus (e) {
        // Select all the text in the input when it is focused.
        e.target.select();
    }

    handleKeyPress (e) {
        // Special case for tab, arrow keys and enter.
        // Tab / shift+tab navigate down / up the list.
        // Arrow down / arrow up navigate down / up the list.
        // Enter / shift+enter insert new blank item below / above.
        const previouslyActiveIndex = this.state.activeIndex;
        const {vm, targetId, id: variableId} = this.props;

        let navigateDirection = 0;
        if (e.key === 'Tab') navigateDirection = e.shiftKey ? -1 : 1;
        else if (e.key === 'ArrowUp') navigateDirection = -1;
        else if (e.key === 'ArrowDown') navigateDirection = 1;
        if (navigateDirection) {
            this.handleDeactivate(); // Submit in-progress edits
            const newIndex = this.wrapListIndex(previouslyActiveIndex + navigateDirection, Object.keys(this.props.value).length);
            this.setState({
                activeIndex: newIndex,
                activeValue: Object.values(this.props.value)[newIndex]
            });
            e.preventDefault(); // Stop default tab behavior, handled by this state change
        }
    }

    handleInput (e) {
        this.setState({activeValue: e.target.value});
    }

    handleRemove (e) {
        e.preventDefault(); // Default would blur input, prevent that.
        e.stopPropagation(); // Bubbling would activate, which will be handled here
        const {vm, targetId, id: variableId} = this.props;
        const newObjectValue = getVariableValue(vm, targetId, variableId);
        delete newObjectValue[Object.keys(newObjectValue)[this.state.activeIndex]]
        setVariableValue(vm, targetId, variableId, newObjectValue);
        const newActiveIndex = Math.min(Object.keys(newObjectValue).length - 1, this.state.activeIndex);
        this.setState({
            activeIndex: newActiveIndex,
            activeValue: Object.values(newObjectValue)[newActiveIndex]
        });
    }

    handleAdd () {
        // Add button appends a blank value and switches to it
        const key = prompt('Enter key...', 'key'); // TODO: replace prompt method
        const {vm, targetId, id: variableId} = this.props;
        const newObjectValue = getVariableValue(vm, targetId, variableId);
        if (Object.keys(newObjectValue).includes(key)) {
          alert(`Value with the key "${key}" already exists!`);
          return;
        }
        newObjectValue[key] = '';
        setVariableValue(vm, targetId, variableId, newObjectValue);
        this.setState({activeIndex: Object.keys(newObjectValue).length - 1, activeValue: ''});
    }

    handleResizeMouseDown (e) {
        this.initialPosition = getEventXY(e);
        this.initialWidth = this.state.width;
        this.initialHeight = this.state.height;

        const onMouseMove = ev => {
            const newPosition = getEventXY(ev);
            const dx = newPosition.x - this.initialPosition.x;
            const dy = newPosition.y - this.initialPosition.y;
            this.setState({
                width: Math.max(Math.min(this.initialWidth + dx, this.props.customStageSize.width), 100),
                height: Math.max(Math.min(this.initialHeight + dy, this.props.customStageSize.height), 60)
            });
        };

        const onMouseUp = ev => {
            onMouseMove(ev); // Make sure width/height are up-to-date
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            this.props.vm.runtime.requestUpdateMonitor(Map({
                id: this.props.id,
                height: this.state.height,
                width: this.state.width
            }));
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

    }

    wrapListIndex (index, length) {
        return (index + length) % length;
    }

    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            ...props
        } = this.props;
        return (
            <ObjectMonitorComponent
                {...props}
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
            />
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
        PropTypes.string
    ]),
    vm: PropTypes.instanceOf(VM),
    width: PropTypes.number,
    x: PropTypes.number,
    y: PropTypes.number
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    vm: state.scratchGui.vm
});

export default connect(mapStateToProps)(ObjectMonitor);
