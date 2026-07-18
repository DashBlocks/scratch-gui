import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import render from '../app-target';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import styles from './donate.css';

import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {Footer} from '../render-interface.jsx';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: 'Donate',
        description: 'Title of the donate page',
        id: 'dash.donate.title'
    },
    invoiceError: {
        defaultMessage: 'Failed to create an invoice, please try again later',
        description: 'Error message when invoice creation fails',
        id: 'dash.donate.invoiceError'
    }
});

const PLANS = [
    {
        offerId: 'dd24b0e7-febf-494c-a3e7-68467bf77512',
        days: 30
    },
    {
        offerId: '8a8a7aa5-922b-48e1-bb9b-11106ed72987',
        days: 90
    },
    {
        offerId: '2cf576f4-37d6-4246-9526-50e592276612',
        days: 180
    },
    {
        offerId: '1db6a6e8-b994-4405-a5ec-0385ce6cb43e',
        days: 360
    }
];

export class Donate extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handlePlanChange',
            'handleCurrencyChange',
            'handleMethodChange',
            'handleSubmit'
        ]);
        this.state = {
            selectedPlan: PLANS[0],
            currency: this.props.intl.locale === 'ru' ? 'RUB' : 'USD',
            method: 'SBP',
            waiting: false,
            error: '',
            expirationDate: new Date(Date.now() + PLANS[0].days * 24 * 60 * 60 * 1000).toLocaleDateString(this.props.intl.locale)
        };
    }

    componentDidMount () {
        document.title = `${this.props.intl.formatMessage(messages.title)} - ${APP_NAME}`;
    }

    handlePlanChange (plan) {
        this.setState({selectedPlan: plan, error: '', expirationDate: new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toLocaleDateString(this.props.intl.locale)});
    }

    handleCurrencyChange (event) {
        const currency = event.target.value;
        this.setState({
            currency,
            method: currency === 'RUB' ? 'SBP' : '',
            error: '',
            expirationDate: new Date(Date.now() + PLANS[0].days * 24 * 60 * 60 * 1000).toLocaleDateString(this.props.intl.locale)
        });
    }

    handleMethodChange (event) {
        this.setState({method: event.target.value, error: '', expirationDate: new Date(Date.now() + this.state.selectedPlan.days * 24 * 60 * 60 * 1000).toLocaleDateString(this.props.intl.locale)});
    }

    async handleSubmit (event) {
        event.preventDefault();
        if (!this.props.session || !this.props.session?.username)
            window.location.href = 'login';
        this.setState({waiting: true, error: ''});

        try {
            const body = {
                offerId: this.state.selectedPlan.offerId,
                currency: this.state.currency
            };
            if (this.state.currency === 'RUB' && this.state.method) {
                body.method = this.state.method;
            }

            const response = await fetch('https://api.dashblocks.org/payments/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok || !data || !data.ok || !data.paymentUrl) {
                throw new Error();
            }
            window.location.href = data.paymentUrl;
        } catch (_) {
            this.setState({error: this.props.intl.formatMessage(messages.invoiceError)});
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
                    <div className={styles.donateWrapper}>
                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Donate"
                                    description="Title of the donate page"
                                    id="dash.donate.title"
                                />
                            </h2>
                            <p>
                                <FormattedMessage
                                    defaultMessage="Support development and get exclusive benefits by donating to Dash!"
                                    description="Description of the donate page"
                                    id="dash.donate.description"
                                />
                            </p>
                            <p>
                                <FormattedMessage
                                    defaultMessage="After donating, the following benefits will be available for you in community:"
                                    description="Description of the benefits of donating"
                                    id="dash.donate.benefits"
                                />
                            </p>
                            <ul>
                                <li>
                                    <FormattedMessage
                                        defaultMessage="Exclusive role and badge in profile"
                                        description="Benefit of donating"
                                        id="dash.donate.benefits.exclusiveRole"
                                    />
                                </li>
                                <li>
                                    <FormattedMessage
                                        defaultMessage="Increase of maximum project size limit from 75MB to 250MB"
                                        description="Benefit of donating"
                                        id="dash.donate.benefits.biggerLimits"
                                    />
                                </li>
                                <li>
                                    <FormattedMessage
                                        defaultMessage="Banner gradient customization for your profile"
                                        description="Benefit of donating"
                                        id="dash.donate.benefits.betaAccess"
                                    />
                                </li>
                                <li>
                                    <FormattedMessage
                                        defaultMessage="...and more benefits in the future!"
                                        description="Benefit of donating"
                                        id="dash.donate.benefits.more"
                                    />
                                </li>
                            </ul>
                            <p>
                                <FormattedMessage
                                    defaultMessage="Choose a plan and currency, then click 'Donate Now' to proceed with payment on Lava.top platform."
                                    description="Instructions for donating"
                                    id="dash.donate.instructions"
                                />
                            </p>
                            <p>
                                <FormattedMessage
                                    defaultMessage="Your additional privileges will be active in your account approximately until: {expirationDate}"
                                    description="Information about when the donation privileges will expire"
                                    id="dash.donate.expiration"
                                    values={{
                                        expirationDate: (
                                            <strong>{this.state.expirationDate}</strong>
                                        )
                                    }}
                                />
                            </p>
                            <p>
                                <FormattedMessage
                                    defaultMessage="If you want to refund your donation, please {contactUs}!"
                                    description="Contact information for donation refunds"
                                    id="dash.donate.refundContact"
                                    values={{
                                        contactUs: (
                                            <a href="contact-us">contact us</a>
                                        )
                                    }}
                                />
                            </p>
                            <div className={styles.section}>
                                <form onSubmit={this.handleSubmit}>
                                    <div className={styles.planGrid}>
                                        {PLANS.map(plan => (
                                            <button
                                                key={plan.offerId}
                                                type="button"
                                                className={classNames(styles.planCard, {
                                                    [styles.selected]: this.state.selectedPlan.offerId === plan.offerId
                                                })}
                                                onClick={() => this.handlePlanChange(plan)}
                                            >
                                                <span className={styles.planTitle}>
                                                    <FormattedMessage
                                                        defaultMessage="{days} days"
                                                        description="Label for plan duration"
                                                        id="dash.donate.planDuration"
                                                        values={{days: plan.days}}
                                                    />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.formRow}>
                                        <label className={styles.label} htmlFor="currency">
                                            <FormattedMessage
                                                defaultMessage="Currency"
                                                description="Label for currency selection"
                                                id="dash.donate.currency"
                                            />
                                        </label>
                                        <select
                                            id="currency"
                                            className={styles.select}
                                            value={this.state.currency}
                                            onChange={this.handleCurrencyChange}
                                        >
                                            <option value="RUB">RUB</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                    {this.state.currency === 'RUB' && (
                                        <div className={styles.formRow}>
                                            <label className={styles.label} htmlFor="method">
                                                <FormattedMessage
                                                    defaultMessage="Payment Method"
                                                    description="Label for payment method selection"
                                                    id="dash.donate.paymentMethod"
                                                />
                                            </label>
                                            <select
                                                id="method"
                                                className={styles.select}
                                                value={this.state.method}
                                                onChange={this.handleMethodChange}
                                            >
                                                <option value="SBP">SBP (СБП)</option>
                                                <option value="CARD">Card (Карта)</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className={styles.actions}>
                                        <Button
                                            className={styles.submitButton}
                                            onClick={this.handleSubmit}
                                            disabled={this.state.waiting}
                                        >
                                            {this.state.waiting ? (
                                                <FormattedMessage
                                                    defaultMessage="Redirecting..."
                                                    description="Button text while redirecting to payment"
                                                    id="dash.donate.redirecting"
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Donate Now"
                                                    description="Button text for submitting donation"
                                                    id="dash.donate.submit"
                                                />
                                            )}
                                        </Button>
                                    </div>
                                    {this.state.error && <div className={styles.error}>{this.state.error}</div>}
                                </form>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </>
        );
    }
}

Donate.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    session: PropTypes.object
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    session: state.scratchGui.dash.session
});

const ConnectedDonate = injectIntl(connect(
    mapStateToProps
)(Donate));
const WrappedDonate = AppStateHOC(ConnectedDonate);

render(<WrappedDonate />);

export default WrappedDonate;
