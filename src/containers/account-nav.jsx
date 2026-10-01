/*
NOTE: this file only temporarily resides in scratch-gui.
Nearly identical code appears in scratch-www, and the two should
eventually be consolidated.
*/

import {injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import AccountNavComponent from '../components/menu-bar/account-nav.jsx';

const AccountNav = function (props) {
    return (
        <AccountNavComponent
            {...props}
        />
    );
};

AccountNav.propTypes = {
    isRtl: PropTypes.bool,
    avatarSrc: PropTypes.string,
    frameId: PropTypes.string,
    profileUrl: PropTypes.string,
    role: PropTypes.string,
    username: PropTypes.string
};

const mapStateToProps = state => ({
    avatarSrc: state.scratchGui.dash.session &&
                    state.scratchGui.dash.session.profile && state.scratchGui.dash.session.profile.avatarId ?
        `https://api.dashblocks.org/users/avatars/${state.scratchGui.dash.session.profile.avatarId}` : '',
    frameId: state.scratchGui.dash.session &&
                    state.scratchGui.dash.session.profile && state.scratchGui.dash.session.profile.avatarFrame ?
        state.scratchGui.dash.session.profile.avatarFrame : '',
    profileUrl: state.scratchGui.dash.session && state.scratchGui.dash.session.id ?
        `user#${state.scratchGui.dash.session.id}` : '',
    role: state.scratchGui.dash.session && state.scratchGui.dash.session.role ?
        state.scratchGui.dash.session.role : '',
    username: state.scratchGui.dash.session && state.scratchGui.dash.session.username ?
        state.scratchGui.dash.session.username : ''
});

const mapDispatchToProps = () => ({});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(AccountNav));
