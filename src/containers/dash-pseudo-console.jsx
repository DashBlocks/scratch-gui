import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import {setConsoleLines, setConsoleCursor} from '../reducers/dash.js';
import PseudoConsoleComponent from '../components/dash-pseudo-console/pseudo-console.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';

class PseudoConsole extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'clear',
            'addLine',
            'editLine',
            'editSymbol',
        ]);
        this.state = {
            linesCount: 25,
            symbols: 80
        };
        this.props.vm.runtime.console = this;
    }
    get realCursor () {
        return {
            row: Math.max(0, Math.min(this.state.linesCount - 1, Math.round(+this.props.cursor.row))),
            symbol: Math.max(0, Math.min(this.state.symbols - 1, Math.round(+this.props.cursor.symbol)))
        };
    }
    clear () {
        this.props.setConsoleLines(new Array());
        this.props.setConsoleCursor(0, 0);
    }
    addLine (line, cursor2NextLine) {
        const splitted = String(line)
            .split('\n')
            .reduce((acc, value) => [...acc, ...value.match(new RegExp(`.{1,${this.state.symbols}}`, 'g'))], []);
        const newLines = this.props.lines.toSpliced(this.realCursor.row, 0, ...splitted);
        this.props.setConsoleLines(newLines.toSpliced(
            0,
            Math.max(0, newLines.length - (this.state.linesCount - 1))
        ));
        if (cursor2NextLine) {
            this.props.setConsoleCursor(
                this.realCursor.row + splitted.length - Math.max(0, newLines.length - (this.state.linesCount - 1)),
                0
            );
        } else {
            this.props.setConsoleCursor(
                this.realCursor.row - Math.max(0, newLines.length - (this.state.linesCount - 1)),
                this.realCursor.symbol
            );
        }
    }
    editLine (line) {
        const splitted = String(line)
            .split('\n')
            .reduce((acc, value) => [...acc, ...value.match(new RegExp(`.{1,${this.state.symbols}}`, 'g'))], []);
        const newLines = this.props.lines.toSpliced(this.realCursor.row, 1, ...splitted);
        this.props.setConsoleLines(newLines.toSpliced(
            0,
            Math.max(0, newLines.length - (this.state.linesCount - 1))
        ));
        this.props.setConsoleCursor(
            this.realCursor.row - Math.max(0, newLines.length - (this.state.linesCount - 1)),
            this.realCursor.symbol
        );
    }
    editSymbol (value) {
        const symbol = String(value)[0];
        const line = (this.props.lines[this.realCursor.row] || '').padEnd(this.realCursor.symbol + 1, ' ');
        this.props.setConsoleLines(this.props.lines.toSpliced(
            this.realCursor.row,
            1,
            line.substring(0, this.realCursor.symbol) + symbol + line.substring(this.realCursor.symbol + 1, line.length)
        ));
    }
    render () {
        return (
            <PseudoConsoleComponent
                cursor={this.realCursor}
                lines={this.props.lines}
                linesCount={this.state.linesCount}
                symbols={this.state.symbols}
                stageSize={this.props.stageSize}
            />
        );
    }
}

PseudoConsole.propTypes = {
    cursor: PropTypes.shape({
        row: PropTypes.number,
        symbol: PropTypes.number
    }).isRequired,
    lines: PropTypes.array,
    setConsoleCursor: PropTypes.func.isRequired,
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
    cursor: state.scratchGui.dash.consoleCursor,
    lines: state.scratchGui.dash.consoleLines
});

const mapDispatchToProps = dispatch => ({
    setConsoleCursor: (row, symbol) => dispatch(setConsoleCursor({row, symbol})),
    setConsoleLines: lines => dispatch(setConsoleLines(lines))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(errorBoundaryHOC('Console')(PseudoConsole));
