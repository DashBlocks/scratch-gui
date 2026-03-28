import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import getSession from '../../lib/session.js';
import render from '../app-target';

import Input from '../../components/forms/input.jsx';
import Button from '../../components/button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import styles from './login.css';

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    needHelp: {
        defaultMessage: 'Need Help?',
        description: 'Button text for user to indicate that they need help',
        id: 'login.needHelp'
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
            waiting: false,
            error: null
        };
    }

    handleChange (e) {
        this.setState({[e.target.name]: e.target.value});
    }

    async handleSubmit (e) {
        e.preventDefault();
        this.setState({waiting: true, error: null});

        const {userId, password} = this.state;
        try {
            const session = await getSession(userId, password);
            if (!session || !session.username) throw new Error('Session failed');
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
                {this.props.session && Object.keys(this.props.session).length > 2 ? window.location.href = "/" : null}
                <div
                    className={styles.container}
                    dir={props.isRtl ? 'rtl' : 'ltr'}
                >
                    <div className={styles.loginWrapper}>
                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Sign in"
                                    description="Log in page header"
                                    id="general.signIn"
                                />
                            </h2>
                            <form
                                className={styles.login}
                                onSubmit={this.handleSubmit}
                            >
                                <label htmlFor="userId">
                                    <FormattedMessage
                                        defaultMessage="User ID"
                                        description="Label for login user ID input"
                                        id="dash.login.userId"
                                    />
                                </label>
                                <Input
                                    required
                                    name="userId"
                                    type="number"
                                    value={this.state.userId}
                                    onChange={this.handleChange}
                                />
            
                                <label htmlFor="password">
                                    <FormattedMessage
                                        defaultMessage="Password"
                                        description="Label for login password input"
                                        id="general.password"
                                    />
                                </label>
                                <Input
                                    required
                                    name="password"
                                    type="password"
                                    value={this.state.password}
                                    onChange={this.handleChange}
                                />
            
                                <div className={styles.submitRow}>
                                    <Button
                                        className={classNames(styles.submitButton, 'white')}
                                        disabled={this.state.waiting}
                                        type="submit"
                                        onClick={this.handleSubmit}
                                    >
                                        {this.state.waiting ? (
                                            <Spinner className={styles.spinner} level="primary" />
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
