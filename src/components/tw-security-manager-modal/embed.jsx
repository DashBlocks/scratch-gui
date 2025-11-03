import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styles from './embed.css';
import URL from './url.jsx';
import DataURL from './data-url.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import { APP_NAME } from '../../lib/brand';

const EmbedModal = props => (
    <div>
        {props.url.startsWith('data:') ? (
            <React.Fragment>
                <p>
                    <FormattedMessage
                        defaultMessage="The project wants to embed HTML content over the stage:"
                        description="Part of modal when a project attempts to embed another page over the stage"
                        id="tw.embed.title1"
                    />
                </p>
                <DataURL url={props.url} />
            </React.Fragment>
        ) : (
            <React.Fragment>
                <p>
                    <FormattedMessage
                        defaultMessage="The project wants to embed remote content over the stage:"
                        description="Part of modal when a project attempts to embed another page over the stage"
                        id="tw.embed.title2"
                    />
                </p>
                <URL url={props.url} />
            </React.Fragment>
        )}

        {props.onChangeRemember && (
            <React.Fragment>
                <label className={styles.rememberContainer}>
                    <FancyCheckbox
                        className={styles.rememberCheckbox}
                        checked={props.remember}
                        onChange={props.onChangeRemember}
                    />
                    <FormattedMessage
                        defaultMessage="Remember this choice"
                        description="Part of modal asking for permission to automatically load next embeds"
                        id="dash.securityModal.rememberThisChoice"
                    />
                </label>
                {props.remember && (
                    <div className={styles.rememberWarning}>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="Loading embeds without permissions is dangerous. It will be able to corrupt your project, delete your settings, phish for passwords, and other bad things. The {APP_NAME} developers are not responsible for any resulting issues."
                            description="Part of modal asking for permission to automatically load custom extension"
                            id="dash.embed.rememberWarning"
                            values={{
                                APP_NAME
                            }}
                        />
                    </div>
                )}
            </React.Fragment>
        )}
        <div className={styles.sandboxed}>
            <FormattedMessage
                // eslint-disable-next-line max-len
                defaultMessage="While the embed will be sandboxed, it will still have access to information about your device such as your IP and general location."
                description="Part of modal when a project attempts to embed another page over the stage"
                id="tw.embed.risks"
            />
        </div>

        {!props.url.startsWith('data:') && (
            <p>
                <FormattedMessage
                    defaultMessage="If allowed, further embeds to the same site will be automatically allowed."
                    description="Part of modal when a project attempts to embed another page over the stage"
                    id="tw.embed.persistent"
                />
            </p>
        )}
    </div>
);

EmbedModal.propTypes = {
    url: PropTypes.string.isRequired,
    remember: PropTypes.bool.isRequired,
    onChangeRemember: PropTypes.func
};

export default EmbedModal;
