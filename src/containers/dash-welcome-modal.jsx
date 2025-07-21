import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import WelcomeModalComponent from '../components/dash-welcome-modal/welcome-modal.jsx';
import {closeWelcomeModal} from '../reducers/modals';

class WelcomeModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleChangeDontShow'
        ]);
        this.state = {
            dontShow: localStorage.getItem('dontShowWelcomeModal') == 'true'
        };
    }
    handleClose () {
        if (this.props.onClose) {
            this.props.onClose();
        } else {
            this.props.dispatchClose();
        }
    }
    handleChangeDontShow (e) {
        this.setState({
            dontShow: e.target.checked
        });
        localStorage.setItem('dontShowWelcomeModal', e.target.checked);
    }
    render () {
        return (
            <WelcomeModalComponent
                onClose={this.handleClose}
                dontShow={this.state.dontShow}
                onChangeDontShow={this.handleChangeDontShow}
            />
        );
    }
}

WelcomeModal.propTypes = {
    onClose: PropTypes.func,
    dispatchClose: PropTypes.func
};

const mapDispatchToProps = dispatch => ({
    dispatchClose: () => dispatch(closeWelcomeModal())
});

export default connect(
    null,
    mapDispatchToProps
)(WelcomeModal);
