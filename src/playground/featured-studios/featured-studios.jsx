import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target.js';
import styles from './featured-studios.css';

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
        defaultMessage: 'Featured Studios',
        description: 'Title of /featured-studios page',
        id: 'dash.featuredStudios.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a studio',
        id: 'tw.studioview.hoverText'
    }
});

const FeaturedStudios = props => {
    const [featuredStudios, setFeaturedStudios] = useState([]);
    const [limit] = useState(20);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFeaturedStudios = async currentOffset => {
        setLoadMoreButtonDisabled(true);
        try {
            const studiosRes = await requestDashApi(
                `/featured/studios?limit=${limit}&offset=${currentOffset}`,
                {credentials: 'include'}
            );
            if (!studiosRes.ok) throw new Error('Failed to fetch featured studios');
            const studiosData = await studiosRes.json();
            if (!studiosData.ok) throw new Error(studiosData.error);
            setFeaturedStudios(prevStudios => [...prevStudios, ...studiosData.studios]);
            setHasMore(studiosData.studios.length === limit);
        } catch (caughtError) {
            setError(caughtError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    useEffect(() => {
        document.title = `${props.intl.formatMessage(messages.title)} - ${APP_NAME}`;
        fetchFeaturedStudios(0);
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
                <div className={styles.featuredStudiosWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="Featured Studios"
                                description="Title of /featured-studios page"
                                id="dash.featuredStudios.title"
                            />
                        </h2>
                        <div className={styles.featuredStudioGrid}>
                            {featuredStudios.length > 0 ? featuredStudios.map(studio => (
                                <div
                                    key={studio.id}
                                    className={styles.featuredStudioCard}
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
                                    defaultMessage="There are no featured studios"
                                    description="Placeholder when there are no featured studios"
                                    id="dash.featuredStudios.placeholder"
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
                                        fetchFeaturedStudios(newOffset);
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
                                            description="Button text for loading more featured studios"
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

FeaturedStudios.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedFeaturedStudios = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(FeaturedStudios));

const WrappedFeaturedStudios = AppStateHOC(ConnectedFeaturedStudios);

render(<WrappedFeaturedStudios />);
