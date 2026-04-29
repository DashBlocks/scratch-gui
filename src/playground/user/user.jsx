import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState, useRef, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, FormattedDate, FormattedRelative, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './user.css';

import {APP_NAME} from '../../lib/brand';
import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import decorate from '../../lib/decorate-text.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import getSession from '../../lib/session';

import BufferedInputHOC from '../../components/forms/buffered-input-hoc.jsx';
import Input from '../../components/forms/input.jsx';
const BufferedInput = BufferedInputHOC(Input);

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
    },
    descriptionPlaceholder: {
        id: 'dash.user.description.placeholder',
        description: 'Placeholder for user\'s description when blank',
        defaultMessage: 'This user is kinda quiet...'
    },
    descriptionInputPlaceholder: {
        id: 'dash.user.description.inputPlaceholder',
        description: 'Placeholder for user\'s description input when blank',
        defaultMessage: 'Who are you? What are you working on? ...'
    },
    descriptionInputPlaceholderForDasher: {
        id: 'dash.user.description.inputPlaceholderForDasher',
        description: 'Placeholder for notifying that descriptions are only available for Dasher+ role and higher',
        defaultMessage: 'Descriptions are available only for Dasher+ role and higher. Come back later!'
    }
});

const User = (props) => {
    const [id, setId] = useState(window.location.hash.replace('#', ''));
    const [userData, setUserData] = useState(null);
    const [descriptionDisabled, setDescriptionDisabled] = useState(false);
    const [projects, setProjects] = useState([]);
    const [avgGradient, setAvgGradient] = useState([]);
    const [isMyProfile, setIsMyProfile] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        setId(window.location.hash.replace('#', ''));
    }, [window.location.hash]);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            let userData;
            try {
                const session = await getSession();
                setIsMyProfile(session?.userId?.toString() === id || session?.username?.toLowerCase() === id?.toLowerCase());
                const userRes = await fetch(`https://dashblocks-server.vercel.app/users/${id}`);
                userData = await userRes.json();

                if (!userData.ok) throw new Error(userData.error);
                document.title = `${userData.user.username} - ${APP_NAME}`
                // Only Dasher+ or higher can do this
                if (userData.user.role === "dasher") setDescriptionDisabled(true);
                setUserData(userData.user);

                const projects = userData.user.projects.slice(0, 20);
                setProjects(projects);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, [id]);

    useEffect(() => {
        const avgGradientByImgSections = async (src, sections, points) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = src;
            await img.decode();

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height).data;
            
            const avgCssColors = [];
            for (let section = 0; section < sections; section++) {
                const colors = [];
                for (let x = 0; x < points; x++) {
                    for (let y = 0; y < points * sections; y++) {
                        const realX = Math.round((section * points + x) * img.width / (sections * points - 1));
                        const realY = Math.round(y * img.height / (sections * points - 1));
                        const i = (realY * img.width + realX) * 4;
                        // Check that the color isn't completely transparent
                        if (imgData[i + 3] > 0) {
                            colors.push([
                                imgData[i],
                                imgData[i + 1],
                                imgData[i + 2],
                                imgData[i + 3]
                            ]);
                        }
                    }
                }
                if (colors.length > 0) {
                    const [r, g, b, a] = colors
                        .reduce(
                            ([r1, g1, b1, a1], [r2, g2, b2, a2]) => [r1 + r2, g1 + g2, b1 + b2, a1 + a2],
                            [0, 0, 0, 0]
                        )
                        .map((v) => v / colors.length);
                    avgCssColors.push(`color-mix(in srgb, rgb(${r}, ${g}, ${b}), var(--ui-white) ${60 + (a - 255) / 2.55 * 0.4}%)`);
                } else {
                    avgCssColors.push("var(--ui-white)");
                }
            }
            return avgCssColors;
        }

        try {
            avgGradientByImgSections(
                `https://dashblocks-server.vercel.app/users/avatars/${userData.profile.avatarId}`,
                5,
                2
            ).then(avgGradient => setAvgGradient(avgGradient));
        } catch (_) {
            // Ignore errors
        }
    }, [userData?.profile?.avatarId]);

    async function handleChangeAvatar (e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('https://dashblocks-server.vercel.app/users/upload-avatar', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await response.json();
        if (data.ok) {
            setUserData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    avatarId: data.avatarId
                }
            }));
        } else {
            alert(data.error);
        }
    }

    async function handleChangeDescription (description) {
        if (!description) return;
        const prevDescription = userData.profile.description;

        setDescriptionDisabled(true);
        setUserData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                description
            }
        }));
        try {
            const response = await fetch('https://dashblocks-server.vercel.app/users/set-description', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({description}),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.error);
            }
        } catch (error) {
            setUserData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    description: prevDescription
                }
            }));
            alert(error.message);
        } finally {
            setDescriptionDisabled(false);
        }
    }

    if (loading) return (
        <>
            <LazyMenuBar />
            <div className={styles.spinner}>
                <Spinner level={'primary'} large />
            </div>
        </>
    );
    if (error) return (
        <>
            <LazyMenuBar />
            <div>Error: {error}</div>
        </>
    );
    if (!userData) return (
        <>
            <LazyMenuBar />
            <div />
        </>
    );

    const joinDate = userData.joinedAt ? new Date(userData.joinedAt) : null;
    const lastActiveDate = userData.lastActive ? new Date(userData.lastActive) : null;
    return (
        <>
            <LazyMenuBar />
            <div
                className={styles.container}
                dir={props.isRtl ? 'rtl' : 'ltr'}
            >
                <div className={styles.userWrapper}>
                    <div
                        className={classNames(styles.section, styles.userHeader)}
                        style={avgGradient.length > 0 ? {
                            backgroundImage: `linear-gradient(to right, ${avgGradient.join(', ')})`
                        } : {}}
                    >
                        <input
                            type='file'
                            accept='.png,.jpg,.jpeg,.img,.gif'
                            ref={fileInputRef}
                            onChange={handleChangeAvatar}
                            style={{ display: 'none' }}
                        />
                        <img
                            draggable={false}
                            src={`https://dashblocks-server.vercel.app/users/avatars/${userData.profile.avatarId}`}
                            alt={userData.username}
                            onClick={() => isMyProfile ? fileInputRef.current.click() : null}
                            className={styles.avatarImg}
                            style={isMyProfile ? { cursor: 'pointer' } : null}
                        />
                        <div className={styles.userInfo}>
                            <div className={styles.userInfoRow}>
                                <h2>{userData.username}</h2>
                                <span className={styles.roleBadge}>
                                    {userData.role === 'dashteam'
                                        ? props.intl.formatMessage(messages.dashTeamRole)
                                        : userData.role === 'dasher+'
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
                                        date: lastActiveDate
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
                        <h2>
                            <FormattedMessage
                                defaultMessage="Description"
                                description="User's description section title on user's profile"
                                id="dash.home.tab.description"
                            />
                        </h2>
                        {isMyProfile ? (
                            <BufferedInput
                                className={classNames(styles.descriptionField)}
                                maxLength="1000"
                                multiline
                                placeholder={props.intl.formatMessage(userData.role === "dasher" ? messages.descriptionInputPlaceholderForDasher : messages.descriptionInputPlaceholder)}
                                tabIndex="0"
                                value={userData.profile.description}
                                onSubmit={handleChangeDescription}
                                disabled={descriptionDisabled}
                            />
                        ) : (
                            <div className={styles.description}>
                                <p>
                                    {userData.profile.description ?
                                        decorate(userData.profile.description, true) : (
                                            <i>{props.intl.formatMessage(messages.descriptionPlaceholder)}</i>
                                        )
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="Projects ({projectsCount})"
                                description="Projects section title on user's profile"
                                id="dash.user.projects"
                                values={{
                                    projectsCount: userData.projects.length
                                }}
                            />
                        </h2>
                        <div className={styles.projectGrid}>
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className={styles.projectCard}
                                    title={props.intl.formatMessage(messages.hoverText, {
                                        author: userData.username,
                                        title: project.name
                                    })}
                                    onClick={() => window.open(`./#${project.id}`, '_blank')}
                                >
                                    <div className={styles.thumbWrapper}>
                                        <img
                                            draggable={false}
                                            src={`https://dashblocks-server.vercel.app/projects/thumbnails/${project.thumbnailId || 1}`}
                                            alt={project.id}
                                        />
                                    </div>
                                    <div className={styles.projectInfo}>
                                        <h4>{project.name}</h4>
                                        <p>
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
                <Footer />
            </div>
        </>
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

const ConnectedUser = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(User));

const WrappedUser = AppStateHOC(ConnectedUser, true);

render(<WrappedUser />);
