import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {FormattedMessage, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Form from '../forms/form.jsx';
import Input from '../../components/forms/input.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import styles from './login-dropdown.css';

const LoginMessages = defineMessages({
    username: {
        defaultMessage: 'Username',
        description: 'Label for login username input',
        id: 'general.username'
    },
    password: {
        defaultMessage: 'Password',
        description: 'Label for login password input',
        id: 'general.password'
    },
    signin: {
        defaultMessage: 'Sign in',
        description: 'Button text for user to sign in',
        id: 'general.signIn'
    },
    needhelp: {
        defaultMessage: 'Need Help?',
        description: 'Button text for user to indicate that they need help',
        id: 'login.needHelp'
    },
    validationRequired: {
        defaultMessage: 'This field is required',
        description: 'Message to tell user they must enter text in a form field',
        id: 'form.validationRequired'
    }
});

class Login extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSubmit'
        ]);
        this.state = {
            waiting: false,
            error: null
        };
    }
    handleSubmit (formData) {
        this.setState({waiting: true});
        this.props.onLogIn(formData, () => {
            this.setState({waiting: false});
        });
    }
    render () {
        let error;
        if (this.state.error) {
            error = <div className={styles.error}>{this.state.error}</div>;
        }
        return (
            <div className={styles.login}>
                <Form onSubmit={this.handleSubmit}>
                    <label
                        htmlFor="username"
                        key="usernameLabel"
                    >
                        <FormattedMessage id="general.username" />
                    </label>
                    <Input
                        required
                        key="usernameInput"
                        maxLength="30"
                        name="username"
                        type="text"
                    />
                    <label
                        htmlFor="password"
                        key="passwordLabel"
                    >
                        <FormattedMessage id="general.password" />
                    </label>
                    <Input
                        required
                        key="passwordInput"
                        name="password"
                        type="password"
                    />
                    <div className={styles.submitRow}>
                        {this.state.waiting ? [
                            <Button
                                className={classNames(styles.submitButton, 'white')}
                                disabled="disabled"
                                key="submitButton"
                                type="submit"
                            >
                                <Spinner
                                    className={styles.spinner}
                                    color="blue"
                                />
                            </Button>
                        ] : [
                            <Button
                                className={classNames(styles.submitButton, 'white')}
                                key="submitButton"
                                type="submit"
                            >
                                <FormattedMessage id="general.signIn" />
                            </Button>
                        ]}
                        {/* <a
                            href="/accounts/password_reset/"
                            key="passwordResetLink"
                        >
                            <FormattedMessage id="login.needHelp" />
                        </a> */}
                    </div>
                    {error}
                </Form>
            </div>
        );
    }
}

Login.propTypes = {
    onLogIn: PropTypes.func
};

export default Login;
