import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import React from 'react';

import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import Divider from '../divider/divider.jsx';
import {MenuItem} from '../menu/menu.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import TWThemeManagerHOC from '../../containers/tw-theme-manager-hoc.jsx';
import SettingsMenu from './lazy-settings-menu.jsx';
import AccountNav from '../../containers/account-nav.jsx';

import TWNews from './tw-news.jsx';
import {isNewYearMode} from '../../components/dash-new-year-mode/new-year-mode.jsx';

import {setSession} from '../../reducers/dash';
import {
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen,
    settingsMenuOpen,
    openSettingsMenu,
    closeSettingsMenu
} from '../../reducers/menus';

import styles from './menu-bar.css';

import messagesIcon from './icon--messages.png';
import mystuffIcon from './icon--mystuff.png';
import dashLogo from './dash.png';
import dashNewYearLogo from './dash-new-year.png'

import isScratchDesktop from '../../lib/isScratchDesktop.js';
import {APP_NAME} from '../../lib/brand.js';

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};


MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const MenuItemTooltip = ({id, isRtl, children, className}) => (
    <ComingSoonTooltip
        className={classNames(styles.comingSoon, className)}
        isRtl={isRtl}
        place={isRtl ? 'left' : 'right'}
        tooltipClassName={styles.comingSoonTooltip}
        tooltipId={id}
    >
        {children}
    </ComingSoonTooltip>
);

MenuItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    isRtl: PropTypes.bool
};

// Unlike <MenuItem href="">, this uses an actual <a>
const MenuItemLink = props => (
    <a
        href={props.href}
        rel="noreferrer"
        target="_blank"
        className={styles.menuItemLink}
    >
        <MenuItem>{props.children}</MenuItem>
    </a>
);

MenuItemLink.propTypes = {
    children: PropTypes.node.isRequired,
    href: PropTypes.string.isRequired
};

class LazyMenuBar extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickLogOut'
        ]);
    }
    async handleClickLogOut () {
        try {
            const response = await fetch('https://dashblocks-server.vercel.app/auth/logout', {credentials: 'include'});
            const data = await response.json();
            if (!data.ok) return alert('Sign out failed');
            this.props.setSession({});
            window.location.reload();
        } catch (error) {
            console.warn(error?.message || error);
            alert('Sign out failed');
        }
    }
    render () {
        const menuBar = (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar,
                    styles.centered
                )}
            >
                <div className={styles.settingsMenu}>
                    <div className={styles.settingsGroup}>
                        {(this.props.canChangeTheme || this.props.canChangeLanguage) && <SettingsMenu
                            className={styles.settingsGroup}
                            canChangeLanguage={this.props.canChangeLanguage}
                            canChangeTheme={this.props.canChangeTheme}
                            isRtl={this.props.isRtl}
                            onClickDesktopSettings={
                                this.props.onClickDesktopSettings &&
                                this.handleClickDesktopSettings
                            }
                            // eslint-disable-next-line react/jsx-no-bind
                            onOpenCustomSettings={
                                this.props.onClickAddonSettings &&
                                this.props.onClickAddonSettings.bind(null, 'editor-theme3')
                            }
                            onRequestClose={this.props.onRequestCloseSettings}
                            onRequestOpen={this.props.onClickSettings}
                            settingsMenuOpen={this.props.settingsMenuOpen}
                        />}
                    </div>
                </div>
                <div className={styles.mainMenu}>
                    <a
                        href="/"
                        rel="noreferrer"
                        target="_blank"
                    >
                        <img
                            className={styles.dashLogo}
                            src={isNewYearMode() ? dashNewYearLogo : dashLogo}
                            draggable={false}
                        />
                    </a>

                    <Divider className={styles.divider} />
                    
                    {!isScratchDesktop() && <div className={styles.menuBarItem}>
                        <a
                            className={styles.feedbackLink}
                            href="https://scratch.mit.edu/discuss/topic/879252/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {/* todo: icon */}
                            <Button className={styles.feedbackButton}>
                                <FormattedMessage
                                    defaultMessage="{APP_NAME} Forum"
                                    description="Button to give link to forum in the menu bar"
                                    id="dash.forumButton"
                                    values={{
                                        APP_NAME
                                    }}
                                />
                            </Button>
                        </a>
                    </div>}
                    {!isScratchDesktop() && (
                        <div
                            className={classNames(styles.menuBarItem, styles.hoverable, styles.editorButton)}
                            onClick={() => window.open("./editor", "_blank")}
                        >
                            {/* todo: icon */}
                            <FormattedMessage
                                defaultMessage="Editor"
                                description="Button to open editor"
                                id="dash.editor"
                            />
                        </div>
                    )}
                </div>
                <div className={styles.accountInfoGroup}>
                    {this.props.sessionExists && this.props.session?.username ? (
                        // User is logged in
                        <React.Fragment>
                            <a href="messages">
                                <div
                                    className={classNames(
                                        styles.menuBarItem,
                                        styles.hoverable,
                                        styles.messagesButton
                                    )}
                                >
                                    <img
                                        className={styles.messagesIcon}
                                        src={messagesIcon}
                                    />
                                </div>
                            </a>
                            <a href="mystuff">
                                <div
                                    className={classNames(
                                        styles.menuBarItem,
                                        styles.hoverable,
                                        styles.mystuffButton
                                    )}
                                >
                                    <img
                                        className={styles.mystuffIcon}
                                        src={mystuffIcon}
                                    />
                                </div>
                            </a>
                            <AccountNav
                                className={classNames(
                                    styles.menuBarItem,
                                    styles.hoverable,
                                    {[styles.active]: this.props.accountMenuOpen}
                                )}
                                isOpen={this.props.accountMenuOpen}
                                isRtl={this.props.isRtl}
                                menuBarMenuClassName={classNames(styles.menuBarMenu)}
                                onClick={this.props.onClickAccount}
                                onClose={this.props.onRequestCloseAccount}
                                onLogOut={this.handleClickLogOut}
                            />
                        </React.Fragment>
                    ) : (
                        // User not logged in
                        <React.Fragment>
                            <div
                                className={classNames(
                                    styles.menuBarItem,
                                    styles.hoverable
                                )}
                                key="join"
                                onMouseUp={() => window.open("./register", '_blank')}
                            >
                                <FormattedMessage
                                    defaultMessage="Join Dash"
                                    description="Link for creating a Dash account"
                                    id="dash.menuBar.joinDash"
                                />
                            </div>
                            <div
                                className={classNames(
                                    styles.menuBarItem,
                                    styles.hoverable
                                )}
                                key="login"
                                onMouseUp={() => window.open("./login", '_blank')}
                            >
                                <FormattedMessage
                                    defaultMessage="Sign in"
                                    description="Link for signing in to your Dash account"
                                    id="dash.menuBar.signIn"
                                />
                            </div>
                        </React.Fragment>
                    )}
                </div>
            </Box>
        );

        return (
            <div dir={this.props.isRtl ? 'rtl' : 'ltr'}>
                <React.Fragment>
                    {menuBar}
                    {/* !process.env.OLD_COMPILER && (<TWNews item='dash:news1' id='new-compiler' />) */}
                    {window.location.href.startsWith('https://dashblocks.github.io/scratch-gui') && (<TWNews item='dash:news2' id='dev-version' />)}
                    {/* <TWNews item='dash:news3' id='new-year' /> */}
                </React.Fragment>
            </div>
        );
    }
}

LazyMenuBar.propTypes = {
    accountMenuOpen: PropTypes.bool,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    className: PropTypes.string,
    currentLocale: PropTypes.string.isRequired,
    intl: intlShape,
    isRtl: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    onClickAccount: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    onClickSettings: PropTypes.func,
    onClickSettingsModal: PropTypes.func,
    onLogOut: PropTypes.func,
    onRequestCloseAccount: PropTypes.func,
    onRequestCloseSettings: PropTypes.func,
    sessionExists: PropTypes.bool,
    settingsMenuOpen: PropTypes.bool,
    setSession: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

LazyMenuBar.defaultProps = {
    canChangeLanguage: true,
    canChangeTheme: true
};

const mapStateToProps = state => {
    const session = state.scratchGui.dash.session;
    return {
        accountMenuOpen: accountMenuOpen(state),
        currentLocale: state.locales.locale,
        isRtl: state.locales.isRtl,
        locale: state.locales.locale,
        sessionExists: typeof session === 'object' && session !== null,
        settingsMenuOpen: settingsMenuOpen(state),
        session: session || null,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = dispatch => ({
    onClickAccount: () => dispatch(openAccountMenu()),
    onRequestCloseAccount: () => dispatch(closeAccountMenu()),
    onClickSettings: () => dispatch(openSettingsMenu()),
    onRequestCloseSettings: () => dispatch(closeSettingsMenu()),
    setSession: session => dispatch(setSession(session))
});

export default compose(
    injectIntl,
    MenuBarHOC,
    TWThemeManagerHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(LazyMenuBar);
