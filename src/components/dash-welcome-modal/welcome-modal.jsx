import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import classNames from 'classnames';

import poster from './dash-poster.png';
import styles from './welcome-modal.css';
import { APP_NAME } from '../../lib/brand.js';

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
            <p className={styles.text}>
                {APP_NAME} was made by <a href="https://scratch.mit.edu/users/damir2809">damir2809</a>, <a href="https://scratch.mit.edu/users/Den4ik-12">Den4ik-12</a>, <a href="https://scratch.mit.edu/users/scratch_craft_2">scratch_craft_2</a>, <a href="https://scratch.mit.edu/users/AnonimKing24">AnonimKing24</a> and other contributors.
                <br />
                View all contributors on <a href={`${process.env.ROOT}credits.html`}>credits page</a>.
            </p>
        </Box>
        <Box className={styles.buttonRow}>
            <button
                className={styles.closeButton}
                onClick={props.onClose}
            >Close</button>
        </Box>
    </Modal>
);

WelcomeModalComponent.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired
};

export default injectIntl(WelcomeModalComponent);
