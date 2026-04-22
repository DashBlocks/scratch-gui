import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import getSession from '../../lib/session.js';
import render from '../app-target.js';

import Input from '../../components/forms/input.jsx';
import Button from '../../components/button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import styles from './account-settings.css';

import {applyGuiColors} from '../../lib/themes/guiHelpers.js';
import {detectTheme} from '../../lib/themes/themePersistance.js';

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    failedToChangePassword: {
        id: 'dash.accountSettings.failedToChangePassword',
        defaultMessage: 'Failed to change password, try again later',
        description: 'Title of error message when changing password failed'
    },
    passwordsDontMatch: {
        id: 'dash.account.passwordsDontMatch',
        defaultMessage: 'Passwords don\'t match',
        description: 'Title of error message when passwords do not match'
    },
    passwordChangedSuccessfully: {
        id: 'dash.accountSettings.passwordChangedSuccessfully',
        defaultMessage: 'Password changed successfully, please log in again',
        description: 'Title of success message when password changed successfully'
    }
});

class AccountSettings extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChangePassword',
            'handleChange'
        ]);
        this.state = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            waiting: false,
            error: null
        };
    }

    componentDidMount() {
        if (!this.props.session || !this.props.session?.username)
            window.location.href = './login';
    }

    handleChange (e) {
        this.setState({[e.target.name]: e.target.value});
    }

    async handleChangePassword (e) {
        e.preventDefault();

        this.setState({waiting: true, error: null});
        try {
            const session = await getSession();
            if (!session || !session.username)
                window.location.href = './login';
            if (this.state.newPassword !== this.state.confirmPassword)
                throw new Error(this.props.intl.formatMessage(messages.passwordsDontMatch));
            const response = await fetch('https://dashblocks-server.vercel.app/auth/change-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    newPassword: this.state.newPassword,
                    currentPassword: this.state.currentPassword
                }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok)
                throw new Error(this.props.intl.formatMessage(messages.failedToChangePassword));
            alert(this.props.intl.formatMessage(messages.passwordChangedSuccessfully));
            window.location.href = './login';
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({waiting: false});
        }
    }

    render () {
        return (
            <>
                <div
                    className={styles.container}
                    dir={this.props.isRtl ? 'rtl' : 'ltr'}
                >
                    <div className={styles.accountSettingsWrapper}>
                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Account Settings"
                                    description="Account settings page header"
                                    id="dash.accountSettings.header"
                                />
                            </h2>
                            <div className={styles.section}>
                                <h3>
                                    <FormattedMessage
                                        defaultMessage="Change Password"
                                        description="Header for change password section of account settings page"
                                        id="dash.accountSettings.changePassword"
                                    />
                                </h3>
                                <form
                                    className={styles.form}
                                    onSubmit={this.handleChangePassword}
                                >
                                    <label htmlFor="currentPassword">
                                        <FormattedMessage
                                            defaultMessage="Current Password"
                                            description="Label for current password input"
                                            id="dash.accountSettings.currentPassword"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="currentPassword"
                                        type="password"
                                        value={this.state.currentPassword}
                                        onChange={this.handleChange}
                                    />

                                    <label htmlFor="newPassword">
                                        <FormattedMessage
                                            defaultMessage="New Password"
                                            description="Label for new password input"
                                            id="dash.accountSettings.newPassword"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="newPassword"
                                        type="password"
                                        value={this.state.newPassword}
                                        onChange={this.handleChange}
                                    />

                                    <label htmlFor="confirmPassword">
                                        <FormattedMessage
                                            defaultMessage="Confirm Password"
                                            description="Label for confirm password input"
                                            id="dash.account.confirmPassword"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="confirmPassword"
                                        type="password"
                                        value={this.state.confirmPassword}
                                        onChange={this.handleChange}
                                    />

                                    <div className={styles.submitRow}>
                                        <Button
                                            className={styles.submitButton}
                                            disabled={this.state.waiting}
                                            onClick={this.handleChangePassword}
                                        >
                                            {this.state.waiting ? (
                                                <Spinner
                                                    className={styles.spinner}
                                                    small
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Submit"
                                                    description="Button text for user to sign in"
                                                    id="dash.login.submit"
                                                />
                                            )}
                                        </Button>
                                    </div>

                                    {this.state.error && (
                                        <div className={styles.error}>{this.state.error}</div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

AccountSettings.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    session: PropTypes.object
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    session: state.scratchGui.dash.session
});

const ConnectedAccountSettings = injectIntl(connect(
    mapStateToProps
)(AccountSettings));

const WrappedAccountSettings = AppStateHOC(ConnectedAccountSettings);

render(<WrappedAccountSettings />);
