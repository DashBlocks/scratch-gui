import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';

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
            lines: new Array(),
            linesCount: 25,
            symbols: 80,
        };
        this.props.vm.console = this;
    }
    clear () {
        this.state.lines = new Array();
    }
    addLine (line) {
        const splitted = line.split('\n').reduce((acc, value) => [...acc, ...value.match(new RegExp(`.{1,${this.state.symbols}}`, 'g'))], []);
        this.state.lines.splice(
            0,
            Math.max(0, this.state.lines.length + splitted.length - this.state.linesCount),
            splitted
        );
    }
    render () {
        return (
            <PseudoConsoleComponent
                lines={this.state.lines}
                linesCount={this.state.linesCount}
                symbols={this.state.symbols}
                stageSize={this.props.stageSize}
            />
        );
    }
}

PseudoConsole.propTypes = {
    stageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        widthDefault: PropTypes.number,
        heightDefault: PropTypes.number
    }).isRequired,
    vm: PropTypes.instanceOf(VM)
};

export default errorBoundaryHOC('Console')(PseudoConsole);
