import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashId from '../user/use-hash-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target.js';
import styles from './project-forks.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand.js';
import {applyGuiColors} from '../../lib/themes/guiHelpers.js';
import {detectTheme} from '../../lib/themes/themePersistance.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: '{project}\'s Forks ({forksCount})',
        description: 'Title of /project-forks page',
        id: 'dash.projectForks.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    }
});

const ProjectForks = props => {
    const id = useHashId();
    const [projectData, setProjectData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [limit, _] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = async currentOffset => {
        setLoadMoreButtonDisabled(true);
        try {
            const projectsRes = await fetch(`https://api.dashblocks.org/projects/${id}/forks?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!projectsRes.ok) throw new Error('Failed to fetch projects');
            const projectsData = await projectsRes.json();
            if (!projectsData.ok) throw new Error(projectsData.error);
            setProjects(prevProjects => [...prevProjects, ...projectsData.forks]);
            setHasMore(projectsData.forks.length === limit);
        } catch (catchedError) {
            setError(catchedError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    useEffect(() => {
        setProjects([]);
        setHasMore(true);
        setOffset(0);
        setError(null);

        document.title = `${props.intl.formatMessage(messages.title, {
            project: 'Project',
            forksCount: '?'
        })} - ${APP_NAME}`;

        setLoading(true);
        const fetchData = async () => {
            const projectReq = await fetch(`https://api.dashblocks.org/projects/${id}`);
            if (!projectReq.ok) {
                setError('Failed to fetch project data');
                setLoading(false);
                return;
            }
            const project = await projectReq.json();
            if (!project.ok) {
                setError(project.error);
                setLoading(false);
                return;
            }
            document.title = `${props.intl.formatMessage(messages.title, {
                project: project.project.name,
                forksCount: project.project.stats?.forks || 0
            })} - ${APP_NAME}`;
            setProjectData(project.project);
            await fetchProjects(0);
            setLoading(false);
        };
        fetchData();
    }, [id]);

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
    if (!projectData || !projects) {
        return (
            <>
                <LazyMenuBar />
                <div>Failed to load project data</div>
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
                <div className={styles.projectForksWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{project}'s Forks ({forksCount})"
                                description="Title of /project-forks page"
                                id="dash.projectForks.title"
                                values={{
                                    project: <a href={`/#${projectData.id}`}>{projectData.name}</a>,
                                    forksCount: projectData.stats?.forks || 0
                                }}
                            />
                        </h2>
                        <div className={styles.projectGrid}>
                            {projects.length > 0 ? projects.map(project => (
                                <div
                                    key={project.id}
                                    className={styles.projectCard}
                                    title={props.intl.formatMessage(messages.hoverText, {
                                        author: project.author.username,
                                        title: project.name
                                    })}
                                >
                                    <div className={styles.thumbWrapper}>
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/projects/thumbnails/${project.thumbnailId || 1}`}
                                            alt={project.id}
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => window.open(`./#${project.id}`, '_blank')}
                                        />
                                    </div>
                                    <div className={styles.projectInfo}>
                                        <h4
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => window.open(`./#${project.id}`, '_blank')}
                                        >{project.name}</h4>
                                        <p>
                                            <FormattedMessage
                                                defaultMessage="by {author}"
                                                description="Displayed under project title to credit creator"
                                                id="tw.studioview.authorAttribution"
                                                values={{
                                                    author: <a
                                                        href={`user#${project.author.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >{project.author.username}</a>
                                                }}
                                            />
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <FormattedMessage
                                    defaultMessage="This project has no forks"
                                    description="Placeholder text when the project has no forks"
                                    id="dash.projectForks.placeholder"
                                />
                            )}
                            {hasMore && (
                                <Button
                                    className={styles.loadMoreButton}
                                    disabled={loadMoreButtonDisabled}
                                    // eslint-disable-next-line react/jsx-no-bind
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

ProjectForks.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedProjectForks = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectForks));

const WrappedProjectForks = AppStateHOC(ConnectedProjectForks);

render(<WrappedProjectForks />);
