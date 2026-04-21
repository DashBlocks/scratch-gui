import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import getSession from '../../lib/session.js';
import render from '../app-target';

import Input from '../../components/forms/input.jsx';
import Button from '../../components/button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import styles from './register.css';

import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    createdButLogInFailed: {
        id: 'dash.register.createdButLogInFailed',
        defaultMessage: 'Account created, but failed to log in. Try to log in by yourself',
        description: 'Title of warning message when account created, but log in failed'
    },
    passwordsDontMatch: {
        id: 'dash.account.passwordsDontMatch',
        defaultMessage: 'Passwords don\'t match',
        description: 'Title of error message when passwords do not match'
    }
});

const redirectLocation = btoa('https://dashblocks-server.vercel.app/auth/verify-scratch');

class Register extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSubmit',
            'handleConfirm',
            'handleChange'
        ]);
        this.state = {
            username: '',
            password: '',
            confirmPassword: '',
            waiting: false,
            verifying: false,
            error: null
        };
    }

    handleChange (e) {
        this.setState({[e.target.name]: e.target.value});
    }

    async handleSubmit (e) {
        e.preventDefault();

        this.setState({waiting: false, verifying: true, error: null});
        window.open(
			`https://auth.itinerary.eu.org/auth/?redirect=${redirectLocation}&name=Dash (DashBlocks)`,
			'_blank',
			'noopener,noreferrer,width=1000,height=700'
		);
    }

    async handleConfirm (e) {
        e.preventDefault();

        this.setState({waiting: true, verifying: false, error: null});
        const {username, password, confirmPassword} = this.state;
        try {
            // Maybe better to do this on backend ¯\_(ツ)_/¯
            if (password !== confirmPassword)
                throw new Error(this.props.intl.formatMessage(messages.passwordsDontMatch));
            const response = await fetch('https://dashblocks-server.vercel.app/auth/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({username, password}),
				credentials: 'include'
            });
            const result = await response.json();
            if (!result.ok)
                throw new Error(result.error);
            const session = await getSession(result.userId, password);
            if (!session || !session.username) {
                alert(this.props.intl.formatMessage(messages.createdButLogInFailed));
                window.location.href = '/login.html';
                return;
            }
            window.location.href = '/';
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({waiting: false});
        }
    }

    render () {
        return (
            <>
                {this.props.session && this.props.session.username ? window.location.href = "/" : null}
                <div
                    className={styles.container}
                    dir={this.props.isRtl ? 'rtl' : 'ltr'}
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
                            <form
                                className={styles.register}
                                onSubmit={this.handleSubmit}
                            >
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

                                <div className={styles.submitRow}>
                                    <Button
                                        className={styles.submitButton}
                                        disabled={this.state.waiting}
                                        onClick={this.state.verifying ? this.handleConfirm : this.handleSubmit}
                                    >
                                        {this.state.waiting ? (
                                            <Spinner
                                                className={styles.spinner}
                                                small
                                            />
                                        ) : (this.state.verifying ? (
                                            <FormattedMessage
                                                defaultMessage="Done"
                                                description="Button text to confirm if user sent auth code to the auth project"
                                                id="dash.register.confirm"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Submit"
                                                description="Button text for account creation"
                                                id="dash.login.submit"
                                            />
                                        ))}
                                    </Button>
                                </div>

                                {this.state.verifying && <div className={styles.authCodeWrapper}>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Verification window should be opened, if not, click {here}"
                                            description="Text to ask to press the button if verification done"
                                            id="dash.register.verification.opened"
                                            values={{
                                                here: (
                                                    <a
                                                        href={`https://auth.itinerary.eu.org/auth/?redirect=${redirectLocation}&name=Dash (DashBlocks)`}
                                                        onClick={(e) => {
                                                            e.preventDefault(); 
                                                            window.open(
                                                                `https://auth.itinerary.eu.org/auth/?redirect=${redirectLocation}&name=Dash (DashBlocks)`,
                                                                '_blank',
                                                                'noopener,noreferrer,width=1000,height=700'
                                                            );
                                                        }}
                                                    >
                                                        <FormattedMessage
                                                            defaultMessage="here"
                                                            description="Link text to open verification page"
                                                            id="dash.register.verification.here"
                                                        />
                                                    </a>
                                                )
                                            }}
                                        />
                                    </p>
                                    <br />
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="After verification, click the button again to confirm"
                                            description="Text to ask to click the button again after verification"
                                            id="dash.register.verification.after"
                                        />
                                    </p>
                                </div>}
                                {this.state.error && (
                                    <div className={styles.error}>{this.state.error}</div>
                                )}
                            </form>
                            <div>
                                <FormattedMessage
                                    defaultMessage="Already have an account? {logIn}"
                                    description="Text prompting user to log in if they already have an account"
									id="dash.register.logIn"
                                    values={{
                                        logIn: (
                                            <a href="./login" target="_blank">
                                                <FormattedMessage
                                                    defaultMessage="Log in"
                                                    description="Link to log in page"
                                                    id="dash.register.logIn"
                                                />
                                            </a>
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </div>
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
