/*
NOTE: this file only temporarily resides in scratch-gui.
Nearly identical code appears in scratch-www, and the two should
eventually be consolidated.
*/

import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuItemContainer from '../../containers/menu-item.jsx';
import FramedAvatar from '../../components/dash-framed-avatar/framed-avatar.jsx';
import dropdownCaret from './dropdown-caret.svg';

import * as styles from './account-nav.css';

const AccountNavComponent = ({
    avatarSrc,
    className,
    frameId,
    isOpen,
    isRtl,
    menuBarMenuClassName,
    onClick,
    onClose,
    onLogOut,
    profileUrl,
    role,
    username
}) => (
    <React.Fragment>
        <div
            className={classNames(
                styles.userInfo,
                className
            )}
            onMouseUp={isOpen ? onClose : onClick}
        >
            {avatarSrc ? (
                <FramedAvatar
                    avatarSrc={avatarSrc}
                    avatarClassName={styles.thumbnail}
                    className={styles.avatar}
                    frameId={frameId}
                />
            ) : null}
            <span className={styles.profileName}>
                {username}
            </span>
            <div className={styles.dropdownCaretPosition}>
                <img
                    className={styles.dropdownCaretIcon}
                    src={dropdownCaret}
                    draggable={false}
                />
            </div>
        </div>
        <MenuBarMenu
            className={menuBarMenuClassName}
            open={isOpen}
            // note: the Rtl styles are switched here, because this menu is justified
            // opposite all the others
            place={isRtl ? 'right' : 'left'}
            onRequestClose={onClose}
        >
            <MenuItemContainer href={profileUrl}>
                <FormattedMessage
                    defaultMessage="Profile"
                    description="Text to link to my user profile, in the account navigation menu"
                    id="gui.accountMenu.profile"
                />
            </MenuItemContainer>
            <MenuItemContainer href="messages">
                <FormattedMessage
                    defaultMessage="Messages"
                    description="Text to link to list of messages, in the account navigation menu"
                    id="gui.accountMenu.messages"
                />
            </MenuItemContainer>
            <MenuItemContainer href="mystuff">
                <FormattedMessage
                    defaultMessage="My Stuff"
                    description="Text to link to list of my projects, in the account navigation menu"
                    id="gui.accountMenu.myStuff"
                />
            </MenuItemContainer>
            {role === 'dashteam' && (
                <MenuItemContainer href="admin">
                    <FormattedMessage
                        defaultMessage="Admin Panel"
                        description="Text to link to admin panel for Dash Team, in the account navigation menu"
                        id="gui.accountMenu.adminPanel"
                    />
                </MenuItemContainer>
            )}
            <MenuItemContainer href="account-settings">
                <FormattedMessage
                    defaultMessage="Account Settings"
                    description="Text to link to my account settings, in the account navigation menu"
                    id="gui.accountMenu.accountSettings"
                />
            </MenuItemContainer>
            <MenuSection>
                <MenuItemContainer onClick={onLogOut}>
                    <FormattedMessage
                        defaultMessage="Sign Out"
                        description="Text to link to sign out, in the account navigation menu"
                        id="gui.accountMenu.signOut"
                    />
                </MenuItemContainer>
            </MenuSection>
        </MenuBarMenu>
    </React.Fragment>
);

AccountNavComponent.propTypes = {
    avatarSrc: PropTypes.string,
    className: PropTypes.string,
    frameId: PropTypes.string,
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    menuBarMenuClassName: PropTypes.string,
    onClick: PropTypes.func,
    onClose: PropTypes.func,
    onLogOut: PropTypes.func,
    profileUrl: PropTypes.string,
    role: PropTypes.string,
    username: PropTypes.string
};

export default AccountNavComponent;
