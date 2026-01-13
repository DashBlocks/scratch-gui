import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import {setConsoleLines} from '../reducers/dash.js';
import PseudoConsoleComponent from '../components/dash-pseudo-console/pseudo-console.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';

class PseudoConsole extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'clear',
            'addLine'
        ]);
        this.state = {
            linesCount: 25,
            symbols: 80,
        };
        this.props.vm.runtime.console = this;
    }
    clear () {
        this.props.setConsoleLines(new Array());
    }
    addLine (line) {
        const splitted = line.split('\n').reduce((acc, value) => [...acc, ...value.match(new RegExp(`.{1,${this.state.symbols}}`, 'g'))], []);
        this.props.setConsoleLines([...this.state.lines, ...splitted].toSpliced(
            0,
            Math.max(0, this.state.lines.length + splitted.length - this.state.linesCount)
        ));
    }
    render () {
        return (
            <PseudoConsoleComponent
                lines={this.props.lines}
                linesCount={this.state.linesCount}
                symbols={this.state.symbols}
                stageSize={this.props.stageSize}
            />
        );
    }
}

PseudoConsole.propTypes = {
    lines: PropTypes.array,
    setConsoleLines: PropTypes.func.isRequired,
    stageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        widthDefault: PropTypes.number,
        heightDefault: PropTypes.number
    }).isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    lines: state.dash.consoleLines
});

const mapDispatchToProps = dispatch => ({
    setConsoleLines: lines => dispatch(setConsoleLines(lines))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(errorBoundaryHOC('Console')(PseudoConsole));