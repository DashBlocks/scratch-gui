import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import getSession from '../../lib/session.js';
import render from '../app-target';

import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import Input from '../../components/forms/input.jsx';
import Button from '../../components/button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import {Footer} from '../render-interface.jsx';

import styles from './register.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: 'Join',
        description: 'Register page title',
        id: 'dash.register.title'
    },
    failedToSignUp: {
        id: 'dash.register.failedToSignUp',
        defaultMessage: 'Failed to create account, try again later',
        description: 'Title of warning message when account creation failed'
    },
    passwordsDontMatch: {
        id: 'dash.account.passwordsDontMatch',
        defaultMessage: 'Passwords don\'t match',
        description: 'Title of error message when passwords do not match'
    }
});

class Register extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSubmit',
            'handleChange'
        ]);
        this.state = {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            verificationCode: '',
            requiresVerification: false,
            waiting: false,
            error: null
        };
    }

    componentDidMount () {
        document.title = `${this.props.intl.formatMessage(messages.title)} - ${APP_NAME}`;
    }

    handleChange (e) {
        this.setState({[e.target.name]: e.target.value});
    }

    async handleSubmit (e) {
        e.preventDefault();

        this.setState({waiting: true, error: null});
        const {email, username, password, confirmPassword, verificationCode} = this.state;
        try {
            // Maybe better to do this on backend ¯\_(ツ)_/¯
            if (password !== confirmPassword) {
                throw new Error(this.props.intl.formatMessage(messages.passwordsDontMatch));
            }
            const response = await fetch('https://api.dashblocks.org/auth/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    ...(verificationCode ? {verificationCode} : {})
                }),
                credentials: 'include'
            });
            if (response.status === 201) {
                this.setState({requiresVerification: true});
                return;
            }
            const result = await response.json();
            if (!result.ok) {
                throw new Error(result.error || this.props.intl.formatMessage(messages.failedToSignUp));
            }
            window.location.href = '/login';
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({waiting: false});
        }
    }

    render () {
        return (
            <>
                <LazyMenuBar />
                {this.props.session && this.props.session.username ? window.location.href = '/' : null}
                <div
                    className={styles.container}
                >
                    <div className={styles.registerWrapper}>
                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Join Dash"
                                    description="Register page header"
                                    id="dash.register.joinDash"
                                />
                            </h2>
                            {this.state.requiresVerification ? (
                                <form
                                    className={styles.register}
                                    onSubmit={this.handleSubmit}
                                >
                                    <label htmlFor="verificationCode">
                                        <FormattedMessage
                                            defaultMessage="Verification Code"
                                            description="Label for verification code input"
                                            id="dash.register.verificationCode"
                                        />
                                    </label>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Please enter the verification code sent to {email}"
                                            description="Instructions for entering verification code"
                                            id="dash.register.verificationCode.instructions"
                                            values={{email: this.state.email}}
                                        />
                                    </p>
                                    <Input
                                        required
                                        name="verificationCode"
                                        type="text"
                                        value={this.state.verificationCode}
                                        onChange={this.handleChange}
                                    />
                                </form>
                            ) : (
                                <form
                                    className={styles.register}
                                    onSubmit={this.handleSubmit}
                                >
                                    <label htmlFor="email">
                                        <FormattedMessage
                                            defaultMessage="Email"
                                            description="Label for register email input"
                                            id="dash.register.email"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="email"
                                        type="email"
                                        value={this.state.email}
                                        onChange={this.handleChange}
                                    />

                                    <label htmlFor="username">
                                        <FormattedMessage
                                            defaultMessage="Create Username"
                                            description="Label for register username input"
                                            id="dash.register.username"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="username"
                                        type="text"
                                        minLength={3}
                                        maxLength={20}
                                        value={this.state.username}
                                        onChange={this.handleChange}
                                    />

                                    <label htmlFor="password">
                                        <FormattedMessage
                                            defaultMessage="Create Password"
                                            description="Label for register password input"
                                            id="general.password"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="password"
                                        type="password"
                                        minLength={8}
                                        maxLength={100}
                                        value={this.state.password}
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
                                        minLength={8}
                                        maxLength={100}
                                        value={this.state.confirmPassword}
                                        onChange={this.handleChange}
                                    />

                                    <p>
                                        <FormattedMessage
                                            defaultMessage="By using Dash, you agree to our {termsOfService} and {privacyPolicy}."
                                            description="Text to inform users about terms of service and privacy policy when registering"
                                            id="dash.tosAndPrivacy"
                                            values={{
                                                termsOfService: (
                                                    <a
                                                        href={`${process.env.ROOT}tos`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <FormattedMessage
                                                            defaultMessage="Terms of Service"
                                                            description="Link to terms of service page"
                                                            id="dash.tosAndPrivacy.tos"
                                                        />
                                                    </a>
                                                ),
                                                privacyPolicy: (
                                                    <a
                                                        href={`${process.env.ROOT}privacy`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <FormattedMessage
                                                            defaultMessage="Privacy Policy"
                                                            description="Link to privacy policy page"
                                                            id="dash.tosAndPrivacy.privacy"
                                                        />
                                                    </a>
                                                )
                                            }}
                                        />
                                    </p>
                                </form>
                            )}

                            <div className={styles.submitRow}>
                                <Button
                                    className={styles.submitButton}
                                    disabled={this.state.waiting}
                                    onClick={this.handleSubmit}
                                >
                                    {this.state.waiting ? (
                                        <Spinner
                                            className={styles.spinner}
                                            small
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Submit"
                                            description="Button text for account creation"
                                            id="dash.register.submit"
                                        />
                                    )}
                                </Button>
                            </div>

                            {this.state.error && (
                                <div className={styles.error}>{this.state.error}</div>
                            )}

                            <div>
                                <FormattedMessage
                                    defaultMessage="Already have an account? {logIn}"
                                    description="Text prompting user to log in if they already have an account"
                                    id="dash.register.logIn"
                                    values={{
                                        logIn: (
                                            <a
                                                href="./login"
                                                target="_blank"
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Log in"
                                                    description="Link to log in page"
                                                    id="dash.register.logInLink"
                                                />
                                            </a>
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </>
        );
    }
}

Register.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    session: PropTypes.object
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    session: state.scratchGui.dash.session
});

const ConnectedRegister = injectIntl(connect(
    mapStateToProps
)(Register));

const WrappedRegister = AppStateHOC(ConnectedRegister);

render(<WrappedRegister />);
