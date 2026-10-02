import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './mystuff.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import getSession, {requestDashApi} from '../../lib/dash-api.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: 'My Stuff',
        description: 'Title of /mystuff page',
        id: 'dash.mystuff.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
    confirmDeleteProject: {
        defaultMessage: 'Are you sure you want to delete {projectName}? This action CANNOT be undone!',
        description: 'Confirmation message when deleting a project',
        id: 'dash.mystuff.confirmDeleteProject'
    },
    confirmDeleteStudio: {
        defaultMessage: 'Are you sure you want to delete {studioName}? This action CANNOT be undone!',
        description: 'Confirmation message when deleting a studio',
        id: 'dash.mystuff.confirmDeleteStudio'
    },
    deletedOnlyFromProfile: {
        defaultMessage: 'Project deleted from your profile, but it still accessable via ID - full deletion requested',
        description: 'Message displayed when a project is only deleted from the user\'s profile',
        id: 'dash.mystuff.deletedOnlyFromProfile'
    }
});

const MyStuff = props => {
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [limit] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);
    const [studios, setStudios] = useState([]);
    const [studiosOffset, setStudiosOffset] = useState(0);
    const [studiosHaveMore, setStudiosHaveMore] = useState(true);
    const [loadMoreStudiosDisabled, setLoadMoreStudiosDisabled] = useState(false);
    const [creatingStudio, setCreatingStudio] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = async (userId, currentOffset) => {
        setLoadMoreButtonDisabled(true);
        try {
            const projectsRes = await requestDashApi(
                `/users/${userId}/projects?limit=${limit}&offset=${currentOffset}`,
                {credentials: 'include'}
            );
            const projectsData = await projectsRes.json();
            if (!projectsData.ok) throw new Error(projectsData.error);
            setProjects(prevProjects => (currentOffset === 0 ?
                (projectsData.projects || []) :
                [...prevProjects, ...(projectsData.projects || [])]));
            setHasMore((projectsData.projects || []).length === limit);
            setOffset(currentOffset);
        } catch (catchedError) {
            setError(catchedError.message);
        } finally {
            setLoadMoreButtonDisabled(false);
        }
    };

    const fetchStudios = async (userId, currentOffset) => {
        setLoadMoreStudiosDisabled(true);
        try {
            const studiosRes = await requestDashApi(
                `/users/${userId}/studios?limit=${limit}&offset=${currentOffset}`,
                {credentials: 'include'}
            );
            const studiosData = await studiosRes.json();
            if (!studiosData.ok) throw new Error(studiosData.error);
            setStudios(prevStudios => (currentOffset === 0 ?
                (studiosData.studios || []) :
                [...prevStudios, ...(studiosData.studios || [])]));
            setStudiosHaveMore((studiosData.studios || []).length === limit);
            setStudiosOffset(currentOffset);
        } catch (catchedError) {
            setError(catchedError.message);
        } finally {
            setLoadMoreStudiosDisabled(false);
        }
    };

    useEffect(() => {
        document.title = `${props.intl.formatMessage(messages.title)} - ${APP_NAME}`;

        const fetchFullProfile = async () => {
            setLoading(true);
            const session = await getSession();
            if (!session || !session.id) {
                setError('Not logged in');
                setLoading(false);
                return;
            }
            try {
                const userRes = await requestDashApi(`/users/${session.id}`);
                const userDataResult = await userRes.json();
                if (!userDataResult.ok) throw new Error(userDataResult.error);

                setUserData(userDataResult.user);
                await Promise.all([
                    fetchProjects(session.id, 0),
                    fetchStudios(session.id, 0)
                ]);
            } catch (catchedError) {
                setError(catchedError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, []);

    const handleCreateStudio = async () => {
        setCreatingStudio(true);
        try {
            const response = await requestDashApi('/studios', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: 'Untitled Studio',
                    description: ''
                }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.error || 'Failed to create studio');
            window.location.href = `./studio#${data.studio.id}`;
        } catch (catchedError) {
            // eslint-disable-next-line no-alert
            alert(`Error creating studio: ${catchedError.message}`);
        } finally {
            setCreatingStudio(false);
        }
    };

    const handleDeleteProject = async projectId => {
        const project = projects.find(p => p.id === projectId);
        if (
            !project ||
                // eslint-disable-next-line no-alert
                !window.confirm(
                    props.intl.formatMessage(messages.confirmDeleteProject, {
                        projectName: project.name
                    })
                )
        ) {
            return;
        }

        try {
            const res = await requestDashApi(`/projects/${projectId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            if (res.status_code === 202) {
                // eslint-disable-next-line no-alert
                alert(props.intl.formatMessage(messages.deletedOnlyFromProfile));
            }

            setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        } catch (catchedError) {
            // eslint-disable-next-line no-alert
            alert(`Error deleting ${project.name} project: ${catchedError.message}`);
        }
    };

    const handleDeleteStudio = async studioId => {
        const studio = studios.find(item => item.id === studioId);
        if (
            !studio ||
                // eslint-disable-next-line no-alert
                !window.confirm(
                    props.intl.formatMessage(messages.confirmDeleteStudio, {
                        studioName: studio.name
                    })
                )
        ) {
            return;
        }

        try {
            const res = await requestDashApi(`/studios/${studioId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            setStudios(prevStudios => prevStudios.filter(item => item.id !== studioId));
        } catch (catchedError) {
            // eslint-disable-next-line no-alert
            alert(`Error deleting ${studio.name} studio: ${catchedError.message}`);
        }
    };

    if (loading) {
        return (
            <>
                <LazyMenuBar />
                <div className={styles.spinner}>
                    <Spinner
                        level={'primary'}
                        large
                    />
                </div>
                <Footer />
            </>
        );
    }
    if (error) {
        return (
            <>
                <LazyMenuBar />
                <div>Error: {error}</div>
                <Footer />
            </>
        );
    }
    if (!userData) {
        return (
            <>
                <LazyMenuBar />
                <div>Failed to load user data</div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <LazyMenuBar />
            <div
                className={styles.container}
                dir={props.isRtl ? 'rtl' : 'ltr'}
            >
                <div className={styles.mystuffWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="My Stuff"
                                description="Title of /mystuff page"
                                id="dash.mystuff.title"
                            />
                        </h2>
                        <div className={styles.createButtons}>
                            <Button
                                className={styles.createButton}
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={() => {
                                    window.location.href = './editor';
                                }}
                            >
                                <FormattedMessage
                                    defaultMessage="Create project"
                                    description="Button label to create a project"
                                    id="dash.mystuff.createProject"
                                />
                            </Button>
                            <Button
                                className={styles.createButton}
                                disabled={creatingStudio}
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={handleCreateStudio}
                            >
                                <FormattedMessage
                                    defaultMessage="Create studio"
                                    description="Button label to create a studio"
                                    id="dash.mystuff.createStudio"
                                />
                            </Button>
                        </div>
                        <h3>
                            <FormattedMessage
                                defaultMessage="Projects"
                                description="Heading for the projects subsection on My Stuff"
                                id="dash.mystuff.projects"
                            />
                        </h3>
                        <div className={styles.projectGrid}>
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className={styles.projectCard}
                                >
                                    <div className={styles.thumbWrapper}>
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/projects/thumbnails/${project.thumbnailId || 1}`}
                                            alt={project.id}
                                        />
                                    </div>
                                    <div className={styles.projectInfo}>
                                        <h4
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => window.open(`./#${project.id}`, '_blank')}
                                            title={props.intl.formatMessage(messages.hoverText, {
                                                author: userData.username,
                                                title: project.name
                                            })}
                                        >{project.name}</h4>
                                        <Button
                                            className={styles.seeInsideButton}
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => window.open(`./editor#${project.id}`, '_blank')}
                                        >
                                            <FormattedMessage
                                                defaultMessage="See inside"
                                                description="Label for see inside button"
                                                id="tw.menuBar.seeInside"
                                            />
                                        </Button>
                                    </div>
                                    <div className={styles.projectStats}>
                                        <p>
                                            <FormattedMessage
                                                defaultMessage="{fires} fires" // TODO: Icon + count
                                                description="Number of fires for a project"
                                                id="dash.project.stats.fires"
                                                values={{
                                                    fires: project.stats?.fires || 0
                                                }}
                                            />
                                        </p>
                                        <Button
                                            className={styles.deleteProjectButton}
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => handleDeleteProject(project.id)}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Delete"
                                                description="Label for delete project button"
                                                id="dash.mystuff.delete"
                                            />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {hasMore && (
                                <Button
                                    className={styles.loadMoreButton}
                                    disabled={loadMoreButtonDisabled}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => {
                                        const newOffset = offset + limit;
                                        setOffset(newOffset);
                                        fetchProjects(userData.id, newOffset);
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
                        <h3>
                            <FormattedMessage
                                defaultMessage="Studios"
                                description="Heading for the studios subsection on My Stuff"
                                id="dash.mystuff.studios"
                            />
                        </h3>
                        <div className={styles.studioGrid}>
                            {studios.map(studio => (
                                <div
                                    key={studio.id}
                                    className={styles.studioCard}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => window.open(`./studio#${studio.id}`, '_blank')}
                                >
                                    <div className={styles.studioThumbWrapper}>
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/studios/thumbnails/${studio.thumbnailId || 1}`}
                                            alt={studio.id}
                                        />
                                    </div>
                                    <div className={styles.studioInfo}>
                                        <h4>{studio.name}</h4>
                                        <Button
                                            className={styles.deleteProjectButton}
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={event => {
                                                event.stopPropagation();
                                                handleDeleteStudio(studio.id);
                                            }}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Delete"
                                                description="Label for delete project button"
                                                id="dash.mystuff.delete"
                                            />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {studiosHaveMore && (
                                <Button
                                    className={styles.loadMoreButton}
                                    disabled={loadMoreStudiosDisabled}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => fetchStudios(userData.id, studiosOffset + limit)}
                                >
                                    {loadMoreStudiosDisabled ? (
                                        <Spinner
                                            className={styles.spinner}
                                            small
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Load more"
                                            description="Button text for loading more studios"
                                            id="dash.mystuff.loadMoreStudios"
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

MyStuff.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedMyStuff = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(MyStuff));

const WrappedMyStuff = AppStateHOC(ConnectedMyStuff);

render(<WrappedMyStuff />);
