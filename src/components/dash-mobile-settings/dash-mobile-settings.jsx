import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';

import dashSettings from '../../lib/dash-settings.js';
import {buzz, onInstallPrompt, promptInstall} from '../../lib/dash-platform.js';
import * as styles from './dash-mobile-settings.css';

class DashMobileSettings extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            open: false,
            settings: dashSettings.all(),
            canInstall: false
        };
        bindAll(this, [
            'handleToggleOpen',
            'handleClose',
            'handleDocumentClick',
            'handleChangeSetting',
            'handleInstall',
            'handleSettingsChange',
            'handleInstallPrompt'
        ]);
    }
    componentDidMount () {
        this.unsubscribeSettings = dashSettings.subscribe(this.handleSettingsChange);
        this.unsubscribeInstall = onInstallPrompt(this.handleInstallPrompt);
        document.addEventListener('mousedown', this.handleDocumentClick, true);
    }
    componentWillUnmount () {
        if (this.unsubscribeSettings) this.unsubscribeSettings();
        if (this.unsubscribeInstall) this.unsubscribeInstall();
        document.removeEventListener('mousedown', this.handleDocumentClick, true);
    }
    handleSettingsChange (settings) {
        this.setState({settings});
    }
    handleInstallPrompt (prompt) {
        this.setState({canInstall: Boolean(prompt)});
    }
    handleDocumentClick (event) {
        if (!this.state.open || !this.wrapperRef) return;
        if (!this.wrapperRef.contains(event.target)) this.handleClose();
    }
    handleToggleOpen () {
        buzz(5);
        this.setState({open: !this.state.open});
    }
    handleClose () {
        this.setState({open: false});
    }
    handleChangeSetting (key) {
        return event => {
            dashSettings.set(key, event.target.checked);
            if (key === 'haptics' && event.target.checked) buzz(10);
        };
    }
    async handleInstall () {
        buzz(5);
        const installed = await promptInstall();
        if (installed) this.handleClose();
    }
    render () {
        const {settings, canInstall} = this.state;
        return (
            <div
                className={styles.wrapper}
                ref={ref => {
                    this.wrapperRef = ref;
                }}
            >
                <button
                    className={styles.toggle}
                    title={this.props.intl.formatMessage({
                        id: 'dash.mobileSettings.title',
                        defaultMessage: 'Touch and phone settings',
                        description: 'Tooltip for the mobile settings button'
                    })}
                    type="button"
                    onClick={this.handleToggleOpen}
                >
                    {'\u{1F4F1}'}
                </button>
                {this.state.open ? (
                    <div className={styles.panel}>
                        <div className={styles.header}>
                            <FormattedMessage
                                defaultMessage="Touch & phone"
                                description="Title of the mobile settings panel"
                                id="dash.mobileSettings.header"
                            />
                        </div>
                        <label className={styles.row}>
                            <input
                                checked={settings.haptics}
                                type="checkbox"
                                onChange={this.handleChangeSetting('haptics')}
                            />
                            <FormattedMessage
                                defaultMessage="Haptic feedback"
                                description="Setting: vibrate on taps and drags"
                                id="dash.mobileSettings.haptics"
                            />
                        </label>
                        <label className={styles.row}>
                            <input
                                checked={settings.keepAwake}
                                type="checkbox"
                                onChange={this.handleChangeSetting('keepAwake')}
                            />
                            <FormattedMessage
                                defaultMessage="Keep screen on"
                                description="Setting: prevent the screen from sleeping"
                                id="dash.mobileSettings.keepAwake"
                            />
                        </label>
                        <label className={styles.row}>
                            <input
                                checked={settings.compact}
                                type="checkbox"
                                onChange={this.handleChangeSetting('compact')}
                            />
                            <FormattedMessage
                                defaultMessage="Compact interface"
                                description="Setting: shrink controls to fit more on screen"
                                id="dash.mobileSettings.compact"
                            />
                        </label>
                        {canInstall ? (
                            <button
                                className={styles.installButton}
                                type="button"
                                onClick={this.handleInstall}
                            >
                                <FormattedMessage
                                    defaultMessage="Install app"
                                    description="Button to install the app to the home screen"
                                    id="dash.mobileSettings.install"
                                />
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    }
}

DashMobileSettings.propTypes = {
    intl: intlShape
};

export default injectIntl(DashMobileSettings);
