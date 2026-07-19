import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashUserId from '../user/use-hash-user-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, FormattedDate, FormattedRelative, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './user-projects.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import getSession from '../../lib/session.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

// Browser support is not perfect yet
const relativeTimeSupported = () => typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined';

const messages = defineMessages({
    title: {
        defaultMessage: '{username}\'s Projects ({projectsCount})',
        description: 'Title of /user-projects page',
        id: 'dash.userProjects.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
});

const UserProjects = (props) => {
    const id = useHashUserId();
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [limit, setLimit] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setProjects([]);
        setHasMore(true);
        setOffset(0);
        setError(null);

        document.title = props.intl.formatMessage(messages.title, {
            username: 'User',
            projectsCount: '?'
        }) + ' - ' + APP_NAME;

        setLoading(true);
        const fetchData = async () => {
            const userReq = await fetch(`https://api.dashblocks.org/users/${id}`);
            if (!userReq.ok) {
                setError('Failed to fetch user data');
                setLoading(false);
                return;
            }
            const user = await userReq.json();
            if (!user.ok) {
                setError(user.error);
                setLoading(false);
                return;
            }
            document.title = props.intl.formatMessage(messages.title, {
                username: user.user.username,
                projectsCount: user.user.profile.stats.projects
            }) + ' - ' + APP_NAME;
            setUserData(user.user);
            await fetchProjects(0);
            setLoading(false);
        }
        fetchData();
    }, [id]);

    const fetchProjects = async (currentOffset) => {
        setLoadMoreButtonDisabled(true);
        try {
            const projectsRes = await fetch(`https://api.dashblocks.org/users/${id}/projects?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!projectsRes.ok) throw new Error('Failed to fetch projects');
            const projectsData = await projectsRes.json();
            if (!projectsData.ok) throw new Error(projectsData.error);
            setProjects(prevProjects => [...prevProjects, ...projectsData.projects]);
            setHasMore(projectsData.projects.length === limit);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

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
    if (!userData || !projects) return (
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
                <div className={styles.userProjectsWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{username}'s Projects ({projectsCount})"
                                description="Title of /user-projects page"
                                id="dash.userProjects.title"
                                values={{
                                    username: <a href={`user#${userData.id}`}>{userData.username}</a>,
                                    projectsCount: userData.profile.stats.projects
                                }}
                            />
                        </h2>
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
                            {hasMore && (
                                <Button
                                    className={styles.loadMoreButton}
                                    disabled={loadMoreButtonDisabled}
                                    onClick={() => {
                                        const newOffset = offset + limit;
                                        setOffset(newOffset);
                                        fetchProjects(newOffset);
                                    }}
                                >
                                    {loadMoreButtonDisabled ? (
                                        <Spinner
                                            className={styles.spinner}
                                            small
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Load more"
                                            description="Button text for loading more messages"
                                            id="dash.messages.loadMore"
                                        />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

UserProjects.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedUserProjects = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(UserProjects));

const WrappedUserProjects = AppStateHOC(ConnectedUserProjects);

render(<WrappedUserProjects />);
