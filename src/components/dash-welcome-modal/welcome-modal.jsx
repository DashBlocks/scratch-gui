import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import classNames from 'classnames';

import poster from './dash-poster.svg';
import styles from './welcome-modal.css';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import {APP_NAME} from '../../lib/brand.js';

const messages = defineMessages({
    welcomeModalTitle: {
        defaultMessage: 'Welcome to Dash!',
        description: 'Title for the welcoming modal',
        id: 'dash.welcomeModal.title'
    }
});

const WelcomeModalComponent = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.onClose}
        contentLabel={props.intl.formatMessage(messages.welcomeModalTitle)}
        id="welcomeModal"
    >
        <Box className={styles.body}>
            <p className={styles.text}>
                <FormattedMessage
                    defaultMessage="{dash} is based on {turbowarp} and adds stuff like {jsonCategory}, {consoleMode}, {newBlocks}, {extensions}, {editorCustomization}, and {otherFeatures}."
                    description="Text in Welcome Modal"
                    id="dash.welcomeModal.text1"
                    values={{
                        dash: <b>Dash</b>,
                        turbowarp: <b>TurboWarp</b>,
                        jsonCategory: (
                            <b>
                                <FormattedMessage
                                    defaultMessage="JSON category"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text1.subtext1"
                                />
                            </b>
                        ),
                        consoleMode: (
                            <b>
                                <FormattedMessage
                                    defaultMessage="console mode"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text1.subtext2"
                                />
                            </b>
                        ),
                        newBlocks: (
                            <b>
                                <FormattedMessage
                                    defaultMessage="new blocks"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text1.subtext3"
                                />
                            </b>
                        ),
                        extensions: (
                            <b>
                                <FormattedMessage
                                    defaultMessage="extensions"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text1.subtext4"
                                />
                            </b>
                        ),
                        editorCustomization: (
                            <b>
                                <FormattedMessage
                                    defaultMessage="editor customization"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text1.subtext5"
                                />
                            </b>
                        ),
                        otherFeatures: (
                            <b>
                                <FormattedMessage
                                    defaultMessage="other features"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text1.subtext6"
                                />
                            </b>
                        )
                    }}
                />
                <br />
                <br />
                <b>
                    <FormattedMessage
                        defaultMessage="Dash features are available only in English and Russian (at the moment)."
                        description="Text in Welcome Modal"
                        id="dash.welcomeModal.text2"
                    />
                </b>
            </p>
            <br />
            <img
                className={styles.poster}
                src={poster}
                draggable={false}
                alt="Dash Poster"
            />
            <p className={styles.text}>
                <FormattedMessage
                    defaultMessage="{APP_NAME} was made by {damir2809DBDev}, {Den4ik12}, {scratch_craft_2Creative}, {AnonimKing24AK24}, and {otherContributors}."
                    description="Text in Welcome Modal"
                    id="dash.welcomeModal.text3"
                    values={{
                        APP_NAME,
                        damir2809DBDev: <><a href="https://scratch.mit.edu/users/damir2809">damir2809</a> (<a href="user#15">DBDev</a>)</>,
                        Den4ik12: <><a href="https://scratch.mit.edu/users/Den4ik-12">Den4ik-12</a> (<a href="user#17">Den4ik-12</a>)</>,
                        scratch_craft_2Creative: <><a href="https://scratch.mit.edu/users/scratch_craft_2">scratch_craft_2</a> (<a href="user#20">Creative</a>)</>,
                        AnonimKing24AK24: <><a href="https://scratch.mit.edu/users/AnonimKing24">AnonimKing24</a> (<a href="user#81">AK24</a>)</>,
                        otherContributors: (
                            <a href="credits">
                                <FormattedMessage
                                    defaultMessage="other contributors"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text3.subtext1"
                                />
                            </a>
                        )
                    }}
                />
                <br />
                <FormattedMessage
                    defaultMessage="Customize editor to your preference on the {addonsPage}."
                    description="Text in Welcome Modal"
                    id="dash.welcomeModal.text4"
                    values={{
                        addonsPage: (
                            <a href="addons">
                                <FormattedMessage
                                    defaultMessage="addons page"
                                    description="Subtext in Welcome Modal"
                                    id="dash.welcomeModal.text4.subtext1"
                                />
                            </a>
                        )
                    }}
                />
            </p>
        </Box>
        <Box className={styles.buttonRow}>
            <label className={styles.dontShowContainer}>
                <FancyCheckbox
                    className={styles.dontShowCheckbox}
                    checked={props.dontShow}
                    onChange={props.onChangeDontShow}
                />
                <p>
                    <FormattedMessage
                        defaultMessage="Don't show this again"
                        description="Label for the checkbox to hide the welcome modal in the future"
                        id="dash.welcomeModal.dontShow"
                    />
                </p>
            </label>
            <p className={styles.text}>
                <FormattedMessage
                    defaultMessage="By using Dash, you agree to our {termsOfService} and {privacyPolicy}."
                    description="Text to inform users about terms of service and privacy policy when registering"
                    id="dash.tosAndPrivacy"
                    values={{
                        termsOfService: (
                            <a href={`${process.env.ROOT}tos`} target="_blank" rel="noopener noreferrer">
                                <FormattedMessage
                                    defaultMessage="Terms of Service"
                                    description="Link to terms of service page"
                                    id="dash.tosAndPrivacy.tos"
                                />
                            </a>
                        ),
                        privacyPolicy: (
                            <a href={`${process.env.ROOT}privacy`} target="_blank" rel="noopener noreferrer">
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
            <button
                className={styles.closeButton}
                onClick={props.onClose}
            >
                <FormattedMessage
                    defaultMessage="Close"
                    description="Text of button to close Welcome Modal"
                    id="dash.welcomeModal.close"
                />
            </button>
        </Box>
    </Modal>
);

WelcomeModalComponent.propTypes = {
    intl: intlShape,
    dontShow: PropTypes.bool.isRequired,
    onChangeDontShow: PropTypes.func,
    onClose: PropTypes.func.isRequired
};

export default injectIntl(WelcomeModalComponent);
