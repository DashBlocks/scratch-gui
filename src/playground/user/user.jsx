import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState, useRef, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, FormattedDate, FormattedTime, FormattedRelative, defineMessages, injectIntl, intlShape} from 'react-intl';
import render from '../app-target';
import styles from './user.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import getSession from '../../lib/session';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

// Browser support is not perfect yet
const relativeTimeSupported = () => typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined';

const messages = defineMessages({
    dasherRole: {
        defaultMessage: 'Dasher',
        description: '"Dasher" role name',
        id: 'dash.user.role.dasher'
    },
    dasherPlusRole: {
        defaultMessage: 'Dasher+',
        description: '"Dasher+" role name',
        id: 'dash.user.role.dasherPlus'
    },
    dashTeamRole: {
        defaultMessage: 'Dash Team',
        description: '"Dash Team" role name',
        id: 'dash.user.role.dashTeam'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    }
});

const User = (props) => {
    const id = window.location.hash.replace('#', '');
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isMyProfile, setIsMyProfile] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            try {
                const session = await getSession();
                setIsMyProfile(session.userId.toString() === id);
                const userRes = await fetch(`https://dashblocks-server.vercel.app/users/${id}`);
                const userData = await userRes.json();

                if (!userData.ok) throw new Error(userData.error);
                document.title = `${userData.user.username} - ${APP_NAME}`
                setUserData(userData.user);

                const projects = userData.user.projects.slice(0, 10);
                setProjects(projects);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, [id]);

    async function handleChangeAvatar (e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        await fetch('https://dashblocks-server.vercel.app/users/upload-avatar', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!userData) return null;

    const joinDate = userData.joinedAt ? new Date(userData.joinedAt) : null;
    const lastActiveDate = userData.lastActive ? new Date(userData.lastActive) : null;
    return (
        <div
            className={styles.container}
            dir={props.isRtl ? 'rtl' : 'ltr'}
        >
            <div className={styles.userWrapper}>
                <div className={classNames(styles.section, styles.userHeader)}>
                    <input
                        type='file'
                        accept='.png,.jpg,.jpeg,.img,.gif'
                        ref={fileInputRef}
                        onChange={handleChangeAvatar}
                        style={{display: 'none'}}
                    />
                    <img
                        draggable={false}
                        src={`https://dashblocks-server.vercel.app/users/avatars/${userData.profile.avatarId}`}
                        alt={userData.username}
                        onClick={() => isMyProfile ? fileInputRef.current.click() : null}
                        className={styles.avatarImg}
                        style={isMyProfile ? {cursor: 'pointer'} : null}
                    />
                    <div className={styles.userInfo}>
                        <div className={styles.userInfoRow}>
                            <h2>{userData.username}</h2>
                            <span className={styles.roleBadge}>
                                {userData.role === 'dashteam'
                                    ? props.intl.formatMessage(messages.dashTeamRole)
                                    : userData === 'dasher+'
                                        ? props.intl.formatMessage(messages.dasherPlusRole)
                                        : props.intl.formatMessage(messages.dasherRole)}
                            </span>
                        </div>
                        <div className={styles.userInfoRow}>
                            <FormattedMessage
                                defaultMessage="Joined: {date}"
                                description="User's account registration date"
                                id="dash.user.joinedAt"
                                values={{
                                    date: joinDate
                                        ? relativeTimeSupported()
                                            ? (<FormattedRelative value={joinDate} />)
                                            : (<FormattedDate value={joinDate} />)
                                        : '?'
                                }}
                            />
                            <div className={styles.userInfoDivider} />
                            <FormattedMessage
                                defaultMessage="Last Active: {date}"
                                description="User's last active date"
                                id="dash.user.lastActive"
                                values={{
                                    date: joinDate
                                        ? relativeTimeSupported()
                                            ? (<FormattedRelative value={lastActiveDate} />)
                                            : (<FormattedDate value={lastActiveDate} />)
                                        : '?' 
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Projects ({userData.projects.length})</h2>
                    <div className={styles.projectGrid}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={styles.projectCard}
                                title={props.intl.formatMessage(messages.hoverText, {
                                    author: userData.username,
                                    title: project.name
                                })}
                                onClick={() => window.open(`https://dashblocks.github.io/#${project.id}`, '_blank')}
                            >
                                <div className={styles.thumbWrapper}>
                                    <img
                                        draggable={false}
                                        src={`https://dashblocks-server.vercel.app/projects/thumbnails/${project.thumbnailId || 1}`}
                                        alt={project.id}
                                    />
                                </div>
                                <div className={styles.projectInfo}>
                                    <h3>{project.name}</h3>
                                    <p
                                        <FormattedMessage
                                            defaultMessage="by {author}"
                                            description="Displayed under project title to credit creator"
                                            id="tw.studioview.authorAttribution"
                                            values={{
                                                author: userData.username
                                            }}
                                        />
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

User.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

render(injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(<User />)));
