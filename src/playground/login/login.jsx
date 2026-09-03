import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import getSession from '../../lib/dash-api.js';
import render from '../app-target';

import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import Input from '../../components/forms/input.jsx';
import Button from '../../components/button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import {Footer} from '../render-interface.jsx';

import styles from './login.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: 'Sign In',
        description: 'Log in page title',
        id: 'dash.login.signIn'
    },
    failedToLogIn: {
        defaultMessage: 'Failed to log in, try again later',
        description: 'Title of error message when log in failed',
        id: 'dash.login.failedToLogIn'
    }
});

class Login extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSubmit',
            'handleChange'
        ]);
        this.state = {
            userId: '',
            password: '',
            verificationCode: '',
            captchaToken: '',
            requiresVerification: false,
            waiting: true,
            error: null
        };
        this.captchaRef = React.createRef();
    }

    componentDidMount () {
        document.title = `${this.props.intl.formatMessage(messages.title)} - ${APP_NAME}`;

        if (this.props.session && this.props.session.username) {
            window.location.href = '/';
        }
    }

    handleChange (e) {
        this.setState({[e.target.name]: e.target.value});
    }

    async handleSubmit (e) {
        e.preventDefault();

        this.setState({waiting: true, error: null});
        const {userId, password, verificationCode, captchaToken} = this.state;
        try {
            const session = await getSession(userId, password, verificationCode, captchaToken);
            if (session && session.requiresVerification) {
                this.setState({requiresVerification: true});
                return;
            }
            if (!session || !session.username) {
                throw new Error(
                    session && session.error ?
                        session.error :
                        this.props.intl.formatMessage(messages.failedToLogIn)
                );
            }
            window.location.href = '/';
        } catch (error) {
            this.setState({error: error.message});
            this.captchaRef.current.resetCaptcha();
        } finally {
            this.setState({waiting: false});
        }
    }

    render () {
        return (
            <>
                <LazyMenuBar />
                <div
                    className={styles.container}
                    dir={this.props.isRtl ? 'rtl' : 'ltr'}
                >
                    <div className={styles.loginWrapper}>
                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Sign In"
                                    description="Log in page title"
                                    id="dash.login.signIn"
                                />
                            </h2>
                            {this.state.requiresVerification ? (
                                <form
                                    className={styles.login}
                                    onSubmit={this.handleSubmit}
                                >
                                    <label htmlFor="verificationCode">
                                        <FormattedMessage
                                            defaultMessage="Verification Code"
                                            description="Label for verification code input"
                                            id="dash.login.verificationCode"
                                        />
                                    </label>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="Please enter the verification code sent to your account's email"
                                            description="Instructions for entering verification code"
                                            id="dash.login.verificationCode.instructions"
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
                                    className={styles.login}
                                    onSubmit={this.handleSubmit}
                                >
                                    <label htmlFor="userId">
                                        <FormattedMessage
                                            defaultMessage="Target (user ID or username)"
                                            description="Label for login target input"
                                            id="dash.login.target"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="userId"
                                        type="text"
                                        value={this.state.userId}
                                        onChange={this.handleChange}
                                    />

                                    <label htmlFor="password">
                                        <FormattedMessage
                                            defaultMessage="Password"
                                            description="Label for login password input"
                                            id="dash.login.password"
                                        />
                                    </label>
                                    <Input
                                        required
                                        name="password"
                                        type="password"
                                        value={this.state.password}
                                        onChange={this.handleChange}
                                    />

                                    <HCaptcha
                                        ref={this.captchaRef}
                                        sitekey="71b6ee4a-c34c-4340-9a52-9e5a648e1348"
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onVerify={token => this.setState({waiting: false, captchaToken: token})}
                                    />
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
                                            description="Button text for user to sign in"
                                            id="dash.login.submit"
                                        />
                                    )}
                                </Button>
                            </div>

                            {this.state.error && (
                                <div className={styles.error}>{this.state.error}</div>
                            )}

                            <div>
                                <FormattedMessage
                                    defaultMessage="New to Dash or don't have an account yet? {signUp}"
                                    description="Text prompting user to sign up if they don't have an account"
                                    id="dash.login.register"
                                    values={{
                                        signUp: (
                                            <a
                                                href="./register"
                                                target="_blank"
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Sign up"
                                                    description="Link to sign up page"
                                                    id="dash.login.signUp"
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

Login.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    session: PropTypes.object
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    session: state.scratchGui.dash.session
});

const ConnectedLogin = injectIntl(connect(
    mapStateToProps
)(Login));

const WrappedLogin = AppStateHOC(ConnectedLogin);

render(<WrappedLogin />);
