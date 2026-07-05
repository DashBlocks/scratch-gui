import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashUserId from '../user/use-hash-user-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, FormattedDate, FormattedRelative, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target.js';
import styles from './search.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand.js';
import {applyGuiColors} from '../../lib/themes/guiHelpers.js';
import {detectTheme} from '../../lib/themes/themePersistance.js';
import getSession from '../../lib/session.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

// Browser support is not perfect yet
const relativeTimeSupported = () => typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined';

const messages = defineMessages({
    title: {
        defaultMessage: 'Search',
        description: 'Title of /search page',
        id: 'dash.search.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
});

const Search = (props) => {
    const query = new URLSearchParams(window.location.search).get('q');
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

        document.title = props.intl.formatMessage(messages.title) + ' - ' + APP_NAME;

        setLoading(true);
        fetchProjects(0);
    }, [query]);

    const fetchProjects = async (currentOffset) => {
        setLoadMoreButtonDisabled(true);
        try {
            const searchReq = await fetch(`https://api.dashblocks.org/search/projects?q=${encodeURIComponent(query)}&limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!searchReq.ok) throw new Error('Failed to fetch search results');
            const searchResults = await searchReq.json();
            if (!searchResults.ok) throw new Error(searchResults.error);
            setProjects(prevProjects => [...prevProjects, ...searchResults.results]);
            setHasMore(searchResults.results.length === limit);
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
    if (!projects) return (
        <>
            <LazyMenuBar />
            <div>Failed to load search results</div>
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
                <div className={styles.searchWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage={"Search Results for \"{query}\""}
                                description="Title of search results page"
                                id="dash.searchResults.title"
                                values={{query}}
                            />
                        </h2>
                        <div className={styles.projectGrid}>
                            {projects.length > 0 ? projects.map((project) => (
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
                                        <h4>{project.name}</h4>
                                        <p>
                                            <FormattedMessage
                                                defaultMessage="by {author}"
                                                description="Displayed under project title to credit creator"
                                                id="tw.studioview.authorAttribution"
                                                values={{
                                                    author: <a href={`user#${project.author.id}`}>{project.author.username}</a>
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
