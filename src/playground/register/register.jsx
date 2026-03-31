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
    }
});

const verificationProjectId = "1288539368";

class Register extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSubmit',
            'handleConfirm',
            'handleChange'
        ]);
        this.state = {
            scratchUsername: '',
            username: '',
            password: '',
            authCode: null,
            waiting: false,
            error: null
        };
    }

    handleChange (e) {
        this.setState({[e.target.name]: e.target.value});
    }

    async handleSubmit (e) {
        e.preventDefault();

        this.setState({authCode: null, waiting: true, error: null});
        try {
            const response = await fetch('https://dashblocks-server.vercel.app/auth/get-auth-code', {credentials: 'include'})
            const result = await response.json();
            if (!result.ok)
                throw new Error(result.error);
            this.setState({authCode: result.code});
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({waiting: false});
        }
    }

    async handleConfirm (e) {
        e.preventDefault();

        this.setState({authCode: null, waiting: true, error: null});
        const {scratchUsername, username, password} = this.state;
        try {
            const response = await fetch('https://dashblocks-server.vercel.app/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scratchUsername, username, password }),
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
                                <label htmlFor="scratchUsername">
                                    <FormattedMessage
                                        defaultMessage="Scratch Username"
                                        description="Label for Scratch username input that will be used to verify auth"
                                        id="dash.register.scratchUsername"
                                    />
                                </label>
                                <Input
                                    required
                                    name="scratchUsername"
                                    type="text"
                                    minLength={3}
                                    maxLength={20}
                                    value={this.state.scratchUsername}
                                    onChange={this.handleChange}
                                />

                                <label htmlFor="username">
                                    <FormattedMessage
                                        defaultMessage="Username"
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
                                        defaultMessage="Password"
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
            
                                <div className={styles.submitRow}>
                                    <Button
                                        className={styles.submitButton}
                                        disabled={this.state.waiting}
                                        onClick={this.state.authCode ? this.handleConfirm : this.handleSubmit}
                                    >
                                        {this.state.waiting ? (
                                            <Spinner
                                                className={styles.spinner}
                                                small
                                            />
                                        ) : (this.state.authCode ? (
                                            <FormattedMessage
                                                defaultMessage="Confirm"
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

                                {this.state.authCode && <div className={styles.authCodeWrapper}>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Copy this code:"
                                            description="Text to ask to copy auth code"
                                            id="dash.register.verification.copyCode"
                                        />
                                    </p>
                                    <code>${this.state.authCode}</code>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Open {verificationProject}"
                                            description="Text to ask to open verification project"
                                            id="dash.register.verification.openProject"
                                            values={{
                                                verificationProject: (
                                                    <a href={`https://scratch.mit.edu/projects/${verificationProjectId}`}>
                                                        <FormattedMessage
                                                            defaultMessage="Verification Project"
                                                            description="Link that opens verification project"
                                                            id="dash.register.verification.project"
                                                        />
                                                    </a>
                                                )
                                            }}
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Comment what did you copied (your verification code)"
                                            description="Text to ask to comment auth code to the project"
                                            id="dash.register.verification.commentAuthCode"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage={"After that click the \"Confirm\" button"}
                                            description="Text to ask when everything is done - click the button"
                                            id="dash.register.verification.clickTheButton"
                                        />
                                    </p>
                                </div>}
                                {this.state.error && (
                                    <div className={styles.error}>{this.state.error}</div>
                                )}
                            </form>
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
