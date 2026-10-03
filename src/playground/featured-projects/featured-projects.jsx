import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target.js';
import styles from './featured-projects.css';

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
        defaultMessage: 'Featured Projects',
        description: 'Title of /featured-projects page',
        id: 'dash.featuredProjects.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    }
});

const FeaturedProjects = props => {
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [limit] = useState(20);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFeaturedProjects = async currentOffset => {
        setLoadMoreButtonDisabled(true);
        try {
            const projectsRes = await requestDashApi(
                `/featured/projects?limit=${limit}&offset=${currentOffset}`,
                {credentials: 'include'}
            );
            if (!projectsRes.ok) throw new Error('Failed to fetch featured projects');
            const projectsData = await projectsRes.json();
            if (!projectsData.ok) throw new Error(projectsData.error);
            setFeaturedProjects(prevProjects => [...prevProjects, ...projectsData.projects]);
            setHasMore(projectsData.projects.length === limit);
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    useEffect(() => {
        document.title = `${props.intl.formatMessage(messages.title)} - ${APP_NAME}`;
        fetchFeaturedProjects(0);
    }, []);

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

    return (
        <>
            <LazyMenuBar />
            <div
                className={styles.container}
                dir={props.isRtl ? 'rtl' : 'ltr'}
            >
                <div className={styles.featuredProjectsWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="Featured Projects"
                                description="Title of /featured-projects page"
                                id="dash.featuredProjects.title"
                            />
                        </h2>
                        <div className={styles.featuredProjectGrid}>
                            {featuredProjects.length > 0 ? featuredProjects.map(project => (
                                <div
                                    key={project.id}
                                    className={styles.featuredProjectCard}
                                    title={props.intl.formatMessage(messages.hoverText, {
                                        author: project.author.username,
                                        title: project.name
                                    })}
                                    // eslint-disable-next-line react/jsx-no-bind
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
                                                values={{author: project.author.username}}
                                            />
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <FormattedMessage
                                    defaultMessage="There are no featured projects"
                                    description="Placeholder when there are no featured projects"
                                    id="dash.featuredProjects.placeholder"
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
                                        fetchFeaturedProjects(newOffset);
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
                                            description="Button text for loading more featured projects"
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

FeaturedProjects.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedFeaturedProjects = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(FeaturedProjects));

const WrappedFeaturedProjects = AppStateHOC(ConnectedFeaturedProjects);

render(<WrappedFeaturedProjects />);
