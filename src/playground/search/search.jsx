import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target.js';
import styles from './search.css';

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
    featuredProjectsTitle: {
        defaultMessage: 'Featured Projects ({projectsCount})',
        description: 'Title of /search page when searching for featured projects',
        id: 'dash.featuredProjects.title'
    },
    featuredStudiosTitle: {
        defaultMessage: 'Featured Studios ({studiosCount})',
        description: 'Title of /search page when searching for featured studios',
        id: 'dash.featuredStudios.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
    projectForksTitle: {
        defaultMessage: '{project}\'s Forks ({forksCount})',
        description: 'Title of /search page when searching for project\'s forks',
        id: 'dash.projectForks.title'
    },
    projectsStudiosTitle: {
        defaultMessage: '{project}\'s Studios ({studiosCount})',
        description: 'Title of /search page when searching for project\'s studios',
        id: 'dash.projectStudios.title'
    },
    searchTitle: {
        defaultMessage: 'Search',
        description: 'Title of /search page',
        id: 'dash.search.title'
    },
    userProjectsTitle: {
        defaultMessage: '{username}\'s Projects ({projectsCount})',
        description: 'Title of /search page when searching for user\'s projects',
        id: 'dash.userProjects.title'
    },
    userStudiosTitle: {
        defaultMessage: '{username}\'s Studios ({studiosCount})',
        description: 'Title of /search page when searching for user\'s studios',
        id: 'dash.userStudios.title'
    },
});

const SPECIFIC_QUERIES = {
    projects: new Map([
        [/^featured:$/i, {
            entrypoint: (limit, currentOffset) => `/featured/projects?limit=${limit}&offset=${currentOffset}`,
            title: (formatMessage, total) => formatMessage(messages.featuredProjectsTitle, {projectsCount: total})
        }],
        [/^forksof:([0-9]+)$/i, {
            entrypoint: (limit, currentOffset, [_, id]) => `/projects/${id}/forks?limit=${limit}&offset=${currentOffset}`,
            title: (formatMessage, total, pre) => formatMessage(messages.projectForksTitle, {
                project: pre,
                forksCount: total
            }),
            pre: async ([_, id]) => {
                const projectReq = await requestDashApi(`/projects/${id}`);
                if (!projectReq.ok) {
                    throw new Error('Failed to fetch project data');
                }
                const project = await projectReq.json();
                if (!project.ok) {
                    throw new Error(project.error);
                }
                return project.project.name;
            }
        }],
        [/^author:(\S+)$/i, {
            entrypoint: (limit, currentOffset, [_, author]) => `/users/${author}/projects?limit=${limit}&offset=${currentOffset}`,
            title: (formatMessage, total, pre) => formatMessage(messages.userProjectsTitle, {
                username: pre,
                projectsCount: total
            }),
            pre: async ([_, author]) => {
                const userReq = await requestDashApi(`/users/${author}`);
                if (!userReq.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const user = await userReq.json();
                if (!user.ok) {
                    throw new Error(user.error);
                }
                return user.user.username;
            }
        }]
    ]),
    studios: new Map([
        [/^featured:$/i, {
            entrypoint: (limit, currentOffset) => `/featured/studios?limit=${limit}&offset=${currentOffset}`,
            title: (formatMessage, total) => formatMessage(messages.featuredStudiosTitle, {studiosCount: total})
        }],
        [/^studiosof:([0-9]+)$/i, {
            entrypoint: (limit, currentOffset, [_, id]) => `/projects/${id}/studios?limit=${limit}&offset=${currentOffset}`,
            title: (formatMessage, total, pre) => formatMessage(messages.projectStudiosTitle, {
                project: pre,
                studiosCount: total
            }),
            pre: async ([_, id]) => {
                const projectReq = await requestDashApi(`/projects/${id}`);
                if (!projectReq.ok) {
                    throw new Error('Failed to fetch project data');
                }
                const project = await projectReq.json();
                if (!project.ok) {
                    throw new Error(project.error);
                }
                return project.project.name;
            }
        }],
        [/^owner:(\S+)$/i, {
            entrypoint: (limit, currentOffset, [_, owner]) => `/users/${owner}/studios?limit=${limit}&offset=${currentOffset}`,
            title: (formatMessage, total, pre) => formatMessage(messages.userStudiosTitle, {
                username: pre,
                studiosCount: total
            }),
            pre: async ([_, author]) => {
                const userReq = await requestDashApi(`/users/${author}`);
                if (!userReq.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const user = await userReq.json();
                if (!user.ok) {
                    throw new Error(user.error);
                }
                return user.user.username;
            }
        }]
    ])
};

const Search = props => {
    const query = new URLSearchParams(window.location.search).get('q');
    const type = new URLSearchParams(window.location.search).get('type') || 'projects';
    const specificQueryEntry = SPECIFIC_QUERIES[type]
        ? SPECIFIC_QUERIES[type].entries().find(([regex]) => query.match(regex))
        : null
    const [pre, setPre] = useState(null);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState([]);
    const [limit, _] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchItems = async (currentOffset, matches, currentPre) => {
        setLoadMoreButtonDisabled(true);
        try {
            const searchReq = await requestDashApi(
                specificQueryEntry
                    ? specificQueryEntry[1].entrypoint(limit, currentOffset, matches)
                    : `/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}&offset=${currentOffset}`,
                {credentials: 'include'}
            );
            if (!searchReq.ok) throw new Error('Failed to fetch search results');
            const searchResults = await searchReq.json();
            if (!searchResults.ok) throw new Error(searchResults.error);
            setTotal(searchResults.total);
            setItems(prevItems => [...prevItems, ...searchResults.results]);
            setHasMore(searchResults.results.length === limit);
            if (specificQueryEntry) {
                document.title = `${specificQueryEntry[1].title(props.intl.formatMessage, searchResults.total, currentPre)} - ${APP_NAME}`;
            }
        } catch (catchedError) {
            setError(catchedError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    useEffect(() => {
        setItems([]);
        setHasMore(true);
        setOffset(0);
        setError(null);

        document.title = `${props.intl.formatMessage(messages.searchTitle)} - ${APP_NAME}`;

        if (!['projects', 'studios'].includes(type)) {
            setError('Invalid item type');
            return;
        }

        setLoading(true);
        const fetchData = async () => {
            const matches = specificQueryEntry ? query.match(specificQueryEntry[0]) : null;
            let currentPre = null;
            if (specificQueryEntry?.[1]?.pre) {
                try {
                    currentPre = await specificQueryEntry[1].pre(matches);
                    setPre(currentPre);
                } catch (catchedError) {
                    setError(catchedError.message);
                    setLoading(false);
                    return;
                }
            }
            if (specificQueryEntry) {
                document.title = `${specificQueryEntry[1].title(props.intl.formatMessage, '?', currentPre)} - ${APP_NAME}`;
            }
            await fetchItems(0, matches, currentPre);
            setLoading(false);
        };
        fetchData();
    }, [query, type]);

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
    if (!items) {
        return (
            <>
                <LazyMenuBar />
                <div>Failed to load search results</div>
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
                <div className={styles.searchWrapper}>
                    <div className={styles.section}>
                        <h2>
                            {specificQueryEntry ? (
                                specificQueryEntry[1].title(props.intl.formatMessage, total, pre)
                            ) : (
                                <FormattedMessage
                                    defaultMessage={'Search Results for "{query}" ({total})'}
                                    description="Title of search results page"
                                    id="dash.searchResults.title"
                                    values={{query, total}}
                                />
                            )}
                        </h2>
                        <div className={styles.projectGrid}>
                            {items.length > 0 ? items.map(item => (
                                <div
                                    key={item.id}
                                    className={styles.projectCard}
                                    title={props.intl.formatMessage(messages.hoverText, {
                                        author: item.author.username,
                                        title: item.name
                                    })}
                                >
                                    <div className={styles.thumbWrapper}>
                                        <img
                                            draggable={false}
                                            src={`https://api.dashblocks.org/projects/thumbnails/${item.thumbnailId || 1}`}
                                            alt={item.id}
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => window.open(`./#${item.id}`, '_blank')}
                                        />
                                    </div>
                                    <div className={styles.projectInfo}>
                                        <h4
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onClick={() => window.open(`./#${item.id}`, '_blank')}
                                        >{item.name}</h4>
                                        <p>
                                            <FormattedMessage
                                                defaultMessage="by {author}"
                                                description="Displayed under project title to credit creator"
                                                id="tw.studioview.authorAttribution"
                                                values={{
                                                    author: <a
                                                        href={`user#${item.author.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >{item.author.username}</a>
                                                }}
                                            />
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <FormattedMessage
                                    defaultMessage="Nothing found"
                                    description="Message displayed when no results found for a search query"
                                    id="dash.searchResults.nothingFound"
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
                                        fetchItems(newOffset, specificQueryEntry ? query.match(specificQueryEntry[0]) : null, pre);
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

Search.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedSearch = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Search));

const WrappedSearch = AppStateHOC(ConnectedSearch);

render(<WrappedSearch />);
