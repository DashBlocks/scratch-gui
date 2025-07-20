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
        this.props.onCloseWelcomeModal();
    }
    handleChangeDontShow (checked) {
        this.setState({dontShow: checked});
        localStorage.setItem('dontShowWelcomeModal', checked);
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
    onCloseWelcomeModal: PropTypes.func,
};

const mapDispatchToProps = dispatch => ({
    onCloseWelcomeModal: () => dispatch(closeWelcomeModal())
});

export default connect(
    null,
    mapDispatchToProps
)(WelcomeModal);
