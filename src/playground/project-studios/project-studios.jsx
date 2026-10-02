import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashId from '../user/use-hash-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target.js';
import styles from './project-studios.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand.js';
import {requestDashApi} from '../../lib/dash-api.js';
import {applyGuiColors} from '../../lib/themes/guiHelpers.js';
import {detectTheme} from '../../lib/themes/themePersistance.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: '{project} Studios ({studiosCount})',
        description: 'Title of /project-studios page',
        id: 'dash.projectStudios.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a studio',
        id: 'tw.studioview.hoverText'
    }
});

const ProjectStudios = props => {
    const id = useHashId();
    const [projectData, setProjectData] = useState(null);
    const [studios, setStudios] = useState([]);
    const [limit] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStudios = async currentOffset => {
        setLoadMoreButtonDisabled(true);
        try {
            const studiosRes = await requestDashApi(
                `/projects/${id}/studios?limit=${limit}&offset=${currentOffset}`,
                {credentials: 'include'}
            );
            if (!studiosRes.ok) throw new Error('Failed to fetch studios');
            const studiosData = await studiosRes.json();
            if (!studiosData.ok) throw new Error(studiosData.error);
            setStudios(prevStudios => [...prevStudios, ...studiosData.studios]);
            setHasMore(studiosData.studios.length === limit);
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    useEffect(() => {
        setStudios([]);
        setHasMore(true);
        setOffset(0);
        setError(null);
        setLoading(true);

        document.title = `${props.intl.formatMessage(messages.title, {
            project: 'Project',
            studiosCount: '?'
        })} - ${APP_NAME}`;

        const fetchData = async () => {
            try {
                const projectReq = await requestDashApi(`/projects/${id}`);
                if (!projectReq.ok) throw new Error('Failed to fetch project data');
                const project = await projectReq.json();
                if (!project.ok) throw new Error(project.error);
                setProjectData(project.project);
                document.title = `${props.intl.formatMessage(messages.title, {
                    project: project.project.name,
                    studiosCount: project.project.stats?.studios || 0
                })} - ${APP_NAME}`;
                await fetchStudios(0);
            } catch (caughtError) {
                setError(caughtError.message);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <>
                <LazyMenuBar />
                <div className={styles.spinner}>
                    <Spinner
                        level="primary"
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
    if (!projectData) {
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
                <div className={styles.projectStudiosWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{project} Studios ({studiosCount})"
                                description="Title of /project-studios page"
                                id="dash.projectStudios.title"
                                values={{
                                    project: <a href={`/#${projectData.id}`}>{projectData.name}</a>,
                                    studiosCount: projectData.stats?.studios || 0
                                }}
                            />
                        </h2>
                        <div className={styles.studioGrid}>
                            {studios.length > 0 ? studios.map(studio => (
                                <div
                                    key={studio.id}
                                    className={styles.studioCard}
                                    title={props.intl.formatMessage(messages.hoverText, {
                                        author: studio.owner.username,
                                        title: studio.name
                                    })}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => window.open(`./studio#${studio.id}`, '_blank')}
                                >
                                    <div className={styles.thumbWrapper}>
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/studios/thumbnails/${studio.thumbnailId || 1}`}
                                            alt={studio.id}
                                        />
                                    </div>
                                    <div className={styles.studioInfo}>
                                        <h4>{studio.name}</h4>
                                        <p>
                                            <FormattedMessage
                                                defaultMessage="by {author}"
                                                description="Displayed under studio title to credit creator"
                                                id="tw.studioview.authorAttribution"
                                                values={{author: studio.owner.username}}
                                            />
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <FormattedMessage
                                    defaultMessage="This project is not in any studios"
                                    description="Placeholder when a project is not in any studios"
                                    id="dash.projectStudios.placeholder"
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
                                        fetchStudios(newOffset);
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
                                            description="Button text for loading more studios"
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

ProjectStudios.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedProjectStudios = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectStudios));

const WrappedProjectStudios = AppStateHOC(ConnectedProjectStudios);

render(<WrappedProjectStudios />);
