import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import classNames from 'classnames';

import poster from './dash-poster.png';
import styles from './welcome-modal.css';

const WelcomeModalComponent = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.onClose}
        contentLabel="Welcome to Dash!"
        id="welcomeModal"
    >
        <Box className={styles.body}>
            <p className={styles.text}>
                Hello, <b>welcome to the Dash!</b>
                <br />
                <br />
                <i>Dash</i> is a <i>TurboWarp</i> and <i>PenguinMod</i> mod with <b>new features</b>.
                <br />
                Don't wait, <b>start creating right now!</b>
                <br />
                <br />
                <b>It's recommended to switch language to English (if you didn't already)</b> because some texts aren't translated or translated wrong.
                <br />
                <br />
            </p>
            <img
                className={styles.poster}
                src={poster}
                draggable={false}
            />
            <Box className={styles.buttonRow}>
                <button
                    className={styles.closeButton}
                    onClick={props.onClose}
                >Close</button>
            </Box>
        </Box>
    </Modal>
);

WelcomeModalComponent.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired
};

export default injectIntl(WelcomeModalComponent);
