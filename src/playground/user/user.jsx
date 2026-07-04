import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState, useRef, useEffect} from 'react';
import useHashUserId from './use-hash-user-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, FormattedDate, FormattedRelative, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './user.css';

import {APP_NAME} from '../../lib/brand';
import {Footer} from '../render-interface.jsx';
import decorate from '../../lib/decorate-text.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import getSession from '../../lib/session';

import Button from '../../components/button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';
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
    dashSupporterRole: {
        defaultMessage: 'Dash Supporter',
        description: '"Dash Supporter" role name',
        id: 'dash.user.role.dashSupporter'
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
    const id = useHashUserId();
    const [userData, setUserData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followButtonDisabled, setFollowButtonDisabled] = useState(false);
    const [descriptionDisabled, setDescriptionDisabled] = useState(false);
    const [recommendProjectButtonDisabled, setRecommendProjectButtonDisabled] = useState(false);
    const [projects, setProjects] = useState([]);
    const [links, setLinks] = useState([]);
    const [linksActionDisabled, setLinksActionDisabled] = useState(false);
    const [isManagingLinks, setIsManagingLinks] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [avgGradient, setAvgGradient] = useState([]);
    const [isMyProfile, setIsMyProfile] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            let user;
            try {
                const session = await getSession();
                setIsMyProfile(session?.id?.toString() === id || session?.username?.toLowerCase() === id?.toLowerCase());
                const userRes = await fetch(`https://api.dashblocks.org/users/${id}`, {credentials: "include"});
                user = await userRes.json();

                if (!user.ok) throw new Error(user.error);
                document.title = `${user.user.username} - ${APP_NAME}`
                // Only Dasher+ or higher can do this
                if (user.user.role === "dasher") setDescriptionDisabled(true);
                setUserData(user.user);
                setIsFollowing(user.user.isFollowing);
                setAchievements(user.user.profile.achievements);
                setLinks(user.user.profile.links);

                const projectsRes = await fetch(`https://api.dashblocks.org/users/${id}/projects?limit=20&offset=0`);
                const projectsData = await projectsRes.json();
                setProjects(projectsData.projects);

                const followersRes = await fetch(`https://api.dashblocks.org/users/${id}/followers?limit=20&offset=0`);
                const followersData = await followersRes.json();
                setFollowers(followersData.followers);

                const followingRes = await fetch(`https://api.dashblocks.org/users/${id}/following?limit=20&offset=0`);
                const followingData = await followingRes.json();
                setFollowing(followingData.following);
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
                `https://api.dashblocks.org/users/avatars/${userData.profile.avatarId}`,
                5,
                2
            ).then(avgGradient => setAvgGradient(avgGradient));
        } catch (_) {
            // Ignore errors
        }
    }, [userData?.profile?.avatarId]);

    const getAchievement = (achievement) => {
        switch (achievement.type) {
            case 'first-project':
                return (
                    <>
                        {/* TODO: Icon */}
                        <h4>
                            <FormattedMessage
                                defaultMessage='First Project'
                                description="Title for achievement for creating the first project"
                                id="dash.user.achievements.firstProject.title"
                            />
                        </h4>
                        <FormattedMessage
                            defaultMessage='Created the first project "{firstProject}" on Dash.'
                            description="Description for achievement for creating the first project, with a link to the project"
                            id="dash.user.achievements.firstProject.info"
                            values={{
                                firstProject: (
                                    <a href={`./#${achievement.project.id}`} target="_blank" rel="noopener noreferrer">
                                        {achievement.project.name}
                                    </a>
                                )
                            }}
                        />
                    </>
                )
            case 'reached-followers-count':
                return (
                    <>
                        {/* TODO: Icon */}
                        <h4>
                            <FormattedMessage
                                defaultMessage='{count} followers have been reached.'
                                description="Title for achievement of reached followers."
                                id="dash.user.achievements.reachedFollowersCount.title"
                                values={{
                                    count: achievement.count
                                }}
                            />
                        </h4>
                        <FormattedMessage
                            defaultMessage='The user has {count} followers on Dash.'
                            description="Description for achievement of reached followers."
                            id="dash.user.achievements.reachedFollowersCount.info"
                            values={{
                                count: achievement.count
                            }}
                        />
                    </>
                )
            default:
                return (
                    <FormattedMessage
                        defaultMessage='Unknown achievement.'
                        description='Displayed when an achievement has an unknown type'
                        id='dash.user.achievements.unknown'
                    />
                )
        }
    }

    async function handleChangeAvatar (e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('https://api.dashblocks.org/users/upload-avatar', {
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

    async function handleClickFollowButton () {
        setFollowButtonDisabled(true);
        const session = await getSession();
        if (!session || !session.id) {
            window.open('./login', '_blank');
            setFollowButtonDisabled(false);
            return;
        }

        const endpoint = isFollowing ? 'unfollow' : 'follow';
        try {
            const response = await fetch(`https://api.dashblocks.org/users/${id}/${endpoint}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.error);
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            alert(error.message);
        } finally {
            setFollowButtonDisabled(false);
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
            const response = await fetch('https://api.dashblocks.org/users/set-description', {
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

    async function handleSetRecommendedProject () {
        // TODO: Project selector instead of prompt
        const projectId = Number(prompt("Project ID:"));
        if (!projectId) return;
        const prevRecommendedProject = userData.profile.recommendedProject;

        setRecommendProjectButtonDisabled(true);
        try {
            const response = await fetch('https://api.dashblocks.org/users/set-recommended-project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({projectId}),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.error);
            }
            const projectData = (await (await fetch(`https://api.dashblocks.org/projects/${projectId}`)).json())?.project;
            setUserData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    recommendedProject: {
                        id: projectId,
                        name: projectData?.name || "Unknown",
                        thumbnailId: projectData?.thumbnailId || 1
                    }
                }
            }));
        } catch (error) {
            setUserData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    recommendedProject: prevRecommendedProject
                }
            }));
            alert(error.message);
        } finally {
            setRecommendProjectButtonDisabled(false);
        }
    }

    async function handleAddLink () {
        const label = prompt('Label (optional):');
        const link = prompt('Link (must start with http:// or https://):');
        if (!link) return;

        setLinksActionDisabled(true);
        try {
            const response = await fetch('https://api.dashblocks.org/users/add-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, link }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) return alert(data.error || 'Failed to add link');
            setUserData(data.user);
            setLinks(data.user.profile?.links || data.user.links || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLinksActionDisabled(false);
        }
    }

    async function handleUpdateLink (index) {
        const prev = links[index] || {};
        const label = prompt('Label (optional):', prev.label);
        const link = prompt('Link (must start with http:// or https://):', prev.link);
        if (!link) return;

        setLinksActionDisabled(true);
        try {
            const response = await fetch('https://api.dashblocks.org/users/update-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkIndex: index, label, link }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) return alert(data.error || 'Failed to update link');
            setUserData(data.user);
            setLinks(data.user.profile?.links || data.user.links || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLinksActionDisabled(false);
        }
    }

    async function handleRemoveLink (index) {
        if (!confirm('Remove this link?')) return;

        setLinksActionDisabled(true);
        try {
            const response = await fetch('https://api.dashblocks.org/users/remove-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkIndex: index }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) return alert(data.error || 'Failed to remove link');
            setUserData(data.user);
            setLinks(data.user.profile?.links || data.user.links || []);
        } catch (error) {
            alert(error.message);
        } finally {
            setLinksActionDisabled(false);
        }
    }

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
    if (!userData) return (
        <>
            <LazyMenuBar />
            <div>Failed to load user data</div>
            <Footer />
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
                            style={{display: 'none'}}
                        />
                        <img
                            draggable={false}
                            src={`https://api.dashblocks.org/users/avatars/${userData.profile.avatarId}`}
                            alt={userData.username}
                            onClick={() => isMyProfile ? fileInputRef.current.click() : null}
                            className={styles.avatarImg}
                            style={isMyProfile ? {cursor: 'pointer'} : null}
                        />
                        <div className={styles.userInfo}>
                            <div className={styles.userInfoRow}>
                                <h2>{userData.username}</h2>
                                <span
                                    className={classNames(styles.roleBadge, {
                                        [styles.dashSupporterRoleBadge]: userData.role === "dash-supporter"
                                    })}
                                >
                                    {userData.role === 'dashteam'
                                        ? props.intl.formatMessage(messages.dashTeamRole)
                                        : userData.role === 'dasher+'
                                            ? props.intl.formatMessage(messages.dasherPlusRole)
                                            : userData.role === "dash-supporter"
                                                ? props.intl.formatMessage(messages.dashSupporterRole)
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
                                                ? (
                                                    <span title={`${props.intl.formatDate(joinDate)}, ${props.intl.formatTime(joinDate)}`}>
                                                        <FormattedRelative value={joinDate} />
                                                    </span>
                                                )
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
                                                ? (
                                                    <span title={`${props.intl.formatDate(lastActiveDate)}, ${props.intl.formatTime(lastActiveDate)}`}>
                                                        <FormattedRelative value={lastActiveDate} />
                                                    </span>
                                                )
                                                : (<FormattedDate value={lastActiveDate} />)
                                            : '?'
                                    }}
                                />
                                {!isMyProfile && <Button
                                    className={styles.followButton}
                                    disabled={followButtonDisabled}
                                    onClick={handleClickFollowButton}
                                >
                                    {followButtonDisabled ? (
                                        <Spinner
                                            className={styles.spinner}
                                            small
                                        />
                                    ) : (isFollowing ? (
                                        <FormattedMessage
                                            defaultMessage="Unfollow"
                                            description="Unfollow button on user's profile"
                                            id="dash.user.unfollow"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Follow"
                                            description="Follow button on user's profile"
                                            id="dash.user.follow"
                                        />
                                    ))}
                                </Button>}
                            </div>
                        </div>
                    </div>
                    <div className={styles.userAbout}>
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
                            <h2>
                                <FormattedMessage
                                    defaultMessage="My links"
                                    description="User's links section title on user's profile"
                                    id="dash.user.myLinks"
                                />
                            </h2>
                            <div className={styles.links}>
                                {links.length > 0 ? (
                                    <ul className={styles.linkList}>
                                        {links.map((link, index) => (
                                            <li key={index} className={styles.linkItem}>
                                                <a href={link.link} target="_blank" rel="noopener noreferrer">
                                                    {link.label || "Link"}
                                                </a>
                                                {isMyProfile && isManagingLinks && (
                                                    <div className={styles.linkActions}>
                                                        <Button
                                                            className={styles.setRecommendedProjectButton}
                                                            disabled={linksActionDisabled}
                                                            onClick={() => handleUpdateLink(index)}
                                                        >
                                                            {linksActionDisabled ? (
                                                                <Spinner className={styles.spinner} small />
                                                            ) : (
                                                                <FormattedMessage
                                                                    defaultMessage="Update link"
                                                                    description="Button text for updating a link on user's profile"
                                                                    id="dash.user.myLinks.update"
                                                                />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            className={styles.setRecommendedProjectButton}
                                                            disabled={linksActionDisabled}
                                                            onClick={() => handleRemoveLink(index)}
                                                        >
                                                            {linksActionDisabled ? (
                                                                <Spinner className={styles.spinner} small />
                                                            ) : (
                                                                <FormattedMessage
                                                                    defaultMessage="Remove link"
                                                                    description="Button text for removing a link on user's profile"
                                                                    id="dash.user.myLinks.remove"
                                                                />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className={styles.noLinksRow}>
                                        <FormattedMessage
                                            defaultMessage="The user has no links"
                                            description="Placeholder text when the user has no links"
                                            id="dash.user.myLinks.placeholder"
                                        />
                                    </div>
                                )}

                                {isMyProfile && isManagingLinks && (
                                    <div className={styles.addLinkRow}>
                                        <Button
                                            className={styles.setRecommendedProjectButton}
                                            disabled={linksActionDisabled}
                                            onClick={handleAddLink}
                                        >
                                            {linksActionDisabled ? (
                                                <Spinner className={styles.spinner} small />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Add link"
                                                    description="Button text for adding a new link on user's profile"
                                                    id="dash.user.myLinks.add"
                                                />
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {isMyProfile && (
                                    <div className={styles.addLinkRow}>
                                        <Button
                                            className={styles.setRecommendedProjectButton}
                                            disabled={linksActionDisabled}
                                            onClick={isManagingLinks ? () => setIsManagingLinks(false) : () => setIsManagingLinks(true)}
                                        >
                                            {linksActionDisabled ? (
                                                <Spinner className={styles.spinner} small />
                                            ) : isManagingLinks ? (
                                                <FormattedMessage
                                                    defaultMessage="Done"
                                                    description="Button text for hiding managing links buttons on user's profile"
                                                    id="dash.user.myLinks.done"
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Manage links"
                                                    description="Button text for showing managing links buttons on user's profile"
                                                    id="dash.user.myLinks.manage"
                                                />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Achievements"
                                    description="User's achievements section title on user's profile"
                                    id="dash.user.achievements"
                                />
                            </h2>
                            <div className={styles.achievements}>
                                {achievements.length > 0 ? (
                                    <div className={styles.achievementList}>
                                        {achievements.map((achievement, index) => (
                                            <div className={styles.achievement} key={index}>
                                                {getAchievement(achievement)}
                                                <div className={styles.achievementDate}>
                                                    {achievement.date
                                                        ? relativeTimeSupported()
                                                            ? (
                                                                <span title={`${props.intl.formatDate(new Date(achievement.date))}, ${props.intl.formatTime(new Date(achievement.date))}`}>
                                                                    <FormattedRelative value={new Date(achievement.date)} />
                                                                </span>
                                                            )
                                                        : (<FormattedDate value={new Date(achievement.date)} />)
                                                    : '?'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="The user has no achievements"
                                        description="Placeholder text when the user has no achievements"
                                        id="dash.user.achievements.placeholder"
                                    />
                                )}
                            </div>
                        </div>
                        {(userData.profile.recommendedProject?.id || isMyProfile) && (
                            <div className={styles.section}>
                                <h2>
                                    <FormattedMessage
                                        defaultMessage="Recommended Project"
                                        description="User's recommended project section title on user's profile"
                                        id="dash.user.recommendedProject"
                                    />
                                </h2>
                                {userData.profile.recommendedProject?.id && (
                                    <div
                                        className={styles.recommendedProject}
                                        title={props.intl.formatMessage(messages.hoverText, {
                                            author: userData.username,
                                            title: userData.profile.recommendedProject.name || "Unknown"
                                        })}
                                        onClick={() => window.open(`./#${userData.profile.recommendedProject.id}`, '_blank')}
                                    >
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/projects/thumbnails/${userData.profile.recommendedProject.thumbnailId || 1}`}
                                            alt={userData.profile.recommendedProject.id}
                                        />
                                        <h4>{userData.profile.recommendedProject.name || "Unknown"}</h4>
                                    </div>
                                )}
                                {isMyProfile && (
                                    <Button
                                        className={styles.setRecommendedProjectButton}
                                        disabled={recommendProjectButtonDisabled}
                                        onClick={handleSetRecommendedProject}
                                    >
                                        {recommendProjectButtonDisabled ? (
                                            <Spinner
                                                className={styles.spinner}
                                                small
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Set recommended project"
                                                description="Button text for setting recommended project on user's profile"
                                                id="dash.user.recommendedProject.set"
                                            />
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Projects ({projectsCount})"
                                    description="Projects section title on user's profile"
                                    id="dash.user.projects"
                                    values={{
                                        projectsCount: userData.profile.stats.projects
                                    }}
                                />
                            </h2>
                            {projects.length === 20 && (
                                <a
                                    onClick={() => window.open(`./user-projects#${userData.username}`, '_blank')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.viewAllLink}
                                >
                                    <FormattedMessage
                                        defaultMessage="View all"
                                        description="Link text for viewing all items on user's profile"
                                        id="dash.user.viewAll"
                                    />
                                </a>
                            )}
                        </div>
                        <div className={styles.projectGrid}>
                            {projects.length > 0 ? projects.map((project) => (
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
                                            src={`https://api.dashblocks.org/projects/thumbnails/${project.thumbnailId || 1}`}
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
                            )) : (
                                <FormattedMessage
                                    defaultMessage="This user has no projects"
                                    description="Placeholder text when the user has no projects"
                                    id="dash.user.projects.placeholder"
                                />
                            )}
                        </div>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Followers ({followersCount})"
                                    description="Followers section title on user's profile"
                                    id="dash.user.followers"
                                    values={{
                                        followersCount: userData.profile.stats.followers
                                    }}
                                />
                            </h2>
                            {followers.length === 20 && (
                                <a
                                    onClick={() => window.open(`./user-followers#${userData.username}`, '_blank')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.viewAllLink}
                                >
                                    <FormattedMessage
                                        defaultMessage="View all"
                                        description="Link text for viewing all items on user's profile"
                                        id="dash.user.viewAll"
                                    />
                                </a>
                            )}
                            <div className={styles.followList}>
                                {followers.length > 0 ? followers.map((follower) => (
                                    <div
                                        key={follower.id}
                                        className={styles.followCard}
                                        onClick={() => window.open(`./user#${follower.id}`, '_blank')}
                                    >
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/users/avatars/${follower.profile.avatarId}`}
                                            alt={follower.username}
                                            className={styles.followAvatar}
                                        />
                                        <span className={styles.followUsername}>{follower.username}</span>
                                    </div>
                                )) : (
                                    <FormattedMessage
                                        defaultMessage="This user has no followers"
                                        description="Placeholder text when the user has no followers"
                                        id="dash.user.followers.placeholder"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Following ({followingCount})"
                                    description="Following section title on user's profile"
                                    id="dash.user.following"
                                    values={{
                                        followingCount: userData.profile.stats.following
                                    }}
                                />
                            </h2>
                            {following.length === 20 && (
                                <a
                                    onClick={() => window.open(`./user-following#${userData.username}`, '_blank')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.viewAllLink}
                                >
                                    <FormattedMessage
                                        defaultMessage="View all"
                                        description="Link text for viewing all items on user's profile"
                                        id="dash.user.viewAll"
                                    />
                                </a>
                            )}
                            <div className={styles.followList}>
                                {following.length > 0 ? following.map((followed) => (
                                    <div
                                        key={followed.id}
                                        className={styles.followCard}
                                        onClick={() => window.open(`./user#${followed.id}`, '_blank')}
                                    >
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/users/avatars/${followed.profile.avatarId}`}
                                            alt={followed.username}
                                            className={styles.followAvatar}
                                        />
                                        <span className={styles.followUsername}>{followed.username}</span>
                                    </div>
                                )) : (
                                    <FormattedMessage
                                        defaultMessage="This user is not following anyone"
                                        description="Placeholder text when the user is not following anyone"
                                        id="dash.user.following.placeholder"
                                    />
                                )}
                            </div>
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

const WrappedUser = AppStateHOC(ConnectedUser);

render(<WrappedUser />);
