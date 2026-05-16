import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './messages.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import getSession from '../../lib/session.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const Messages = (props) => {
    const [userData, setUserData] = useState(null);
    const [userMessages, setUserMessages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            const session = await getSession();
            if (!session || !session.userId) {
                setError('Not logged in');
                setLoading(false);
                return;
            }
            let userData;
            try {
                const userRes = await fetch(`https://dashblocks-server.vercel.app/users/${session.userId}`);
                userData = await userRes.json();
                if (!userData.ok) throw new Error(userData.error);
                setUserData(userData.user);
                setUserMessages(session.messages);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, []); // Let's say session won't change

    if (loading) return (
        <>
            <LazyMenuBar />
            <div className={styles.spinner}>
                <Spinner level={'primary'} large />
            </div>
            <Footer />
        </>
    );
    if (error) return (
        <>
            <LazyMenuBar />
            <div>Error: {error}</div>
            <Footer />
        </>
    );
    if (!userData || !userMessages) return (
        <>
            <LazyMenuBar />
            <div>Failed to load user data</div>
            <Footer />
        </>
    );

    return (
        <>
            <LazyMenuBar />
            <div
                className={styles.container}
                dir={props.isRtl ? 'rtl' : 'ltr'}
            >
                <div className={styles.messagesWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="Messages"
                                description="Title of /messages page"
                                id="dash.messages.title"
                            />
                        </h2>
                        <div className={styles.messagesGrid}>
                            {userMessages.map((message, index) => (
                                <div
                                    key={index}
                                    className={styles.messageItem}
                                >
                                    {/* TODO: Icon based on message type */}
                                    <div className={styles.messageContent}>
                                        {message.type === 'fired' ?
                                            <FormattedMessage
                                                defaultMessage="{user} fired your project {project}"
                                                description="Displayed when someone fired user's project"
                                                id="dash.messages.fired"
                                                values={{
                                                    user: <a href={`user#${message.user.username}`}>{message.user.username}</a>,
                                                    project: <a href={`/#${message.id}`}>{message.name}</a>
                                                }}
                                            /> :
                                            message.type === 'featured' ?
                                                <FormattedMessage
                                                    defaultMessage="Your project {project} got featured!"
                                                    description="Displayed when user's project is featured"
                                                    id="dash.messages.featured"
                                                    values={{
                                                        project: <a href={`/#${message.id}`}>{message.name}</a>
                                                    }}
                                                /> :
                                                message.type === 'promoted' && message.role === 'dasher+' ?
                                                    <FormattedMessage
                                                        defaultMessage="Congrats! You are now Dasher+, now you can {setDescription} in your profile and upload projects with custom extensions"
                                                        description="Displayed when user got promoted to Dasher+ role"
                                                        id="dash.messages.promotedDasherPlus"
                                                        values={{
                                                            setDescription: <a href={`user#${userData.username}`}>{props.intl.formatMessage({
                                                                defaultMessage: 'set a description',
                                                                description: 'Label for link to set profile description in promotedDasherPlus message',
                                                                id: 'dash.messages.promotedDasherPlus.setDescription'
                                                            })}</a>
                                                        }}
                                                    /> :
                                                    message.type === 'promoted' && message.role === 'dasher' ?
                                                        <FormattedMessage
                                                            defaultMessage="You got demoted to Dasher role"
                                                            description="Displayed when user got demoted to Dasher role"
                                                            id="dash.messages.demotedDasher"
                                                        /> :
                                                        <FormattedMessage
                                                            defaultMessage="Unknown message type"
                                                            description="Displayed when a message has an unknown type"
                                                            id="dash.messages.unknownMessageType"
                                                        />
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

Messages.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedMessages = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Messages));

const WrappedMessages = AppStateHOC(ConnectedMessages);

render(<WrappedMessages />);
