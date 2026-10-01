import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashId from '../user/use-hash-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './studio.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand';
import {requestDashApi} from '../../lib/dash-api.js';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: '{studio} ({projectsCount})',
        description: 'Title of /studio page',
        id: 'dash.studio.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    }
});

const Studio = props => {
    const id = useHashId();
    const [studioData, setStudioData] = useState(null);
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
            const projectsRes = await requestDashApi(`/studios/${id}/projects?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!projectsRes.ok) throw new Error('Failed to fetch projects');
            const projectsData = await projectsRes.json();
            if (!projectsData.ok) throw new Error(projectsData.error);
            setProjects(prevProjects => [...prevProjects, ...projectsData.projects]);
            setHasMore(projectsData.projects.length === limit);
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
            studio: 'Studio',
            projectsCount: '?'
        })} - ${APP_NAME}`;

        setLoading(true);
        const fetchData = async () => {
            const studioReq = await requestDashApi(`/studios/${id}`);
            if (!studioReq.ok) {
                setError('Failed to fetch studio data');
                setLoading(false);
                return;
            }
            const studio = await studioReq.json();
            if (!studio.ok) {
                setError(studio.error);
                setLoading(false);
                return;
            }
            document.title = `${props.intl.formatMessage(messages.title, {
                studio: studio.studio.name,
                projectsCount: studio.studio.projectsCount
            })} - ${APP_NAME}`;
            setStudioData(studio.studio);
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
    if (!studioData || !projects) {
        return (
            <>
                <LazyMenuBar />
                <div>Failed to load studio data</div>
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
                <div className={styles.studioWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{studio} ({projectsCount})"
                                description="Title of /studio page"
                                id="dash.studio.title"
                                values={{
                                    studio: studioData.name,
                                    projectsCount: studioData.projectsCount
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
                                    defaultMessage="This studio has no projects"
                                    description="Placeholder text when the studio has no projects"
                                    id="dash.studio.projects.placeholder"
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

Studio.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedStudio = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Studio));

const WrappedStudio = AppStateHOC(ConnectedStudio);

render(<WrappedStudio />);
