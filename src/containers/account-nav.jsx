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
    const {
        ...componentProps
    } = props;
    return (
        <AccountNavComponent
            {...componentProps}
        />
    );
};

AccountNav.propTypes = {
    isRtl: PropTypes.bool,
    profileUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.string
};

const mapStateToProps = state => ({
    profileUrl: state.scratchGui.dash.session && state.scratchGui.dash.session.id ?
        `user#${state.scratchGui.dash.session.id}` : '',
    thumbnailUrl: state.scratchGui.dash.session && state.scratchGui.dash.session.profile && state.scratchGui.dash.session.profile.avatarId ?
        `https://dashblocks-server.vercel.app/users/avatars/${state.scratchGui.dash.session.profile.avatarId}` : '',
    username: state.scratchGui.dash.session && state.scratchGui.dash.session.username ?
        state.scratchGui.dash.session.username : '',
    role: state.scratchGui.dash.session && state.scratchGui.dash.session.role ?
        state.scratchGui.dash.session.role : ''
});

const mapDispatchToProps = () => ({});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(AccountNav));
