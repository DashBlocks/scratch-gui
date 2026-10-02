import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashId from '../user/use-hash-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './user-studios.css';

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
        defaultMessage: '{username}\'s Studios ({studiosCount})',
        description: 'Title of /user-studios page',
        id: 'dash.userStudios.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    }
});

const UserStudios = props => {
    const id = useHashId();
    const [userData, setUserData] = useState(null);
    const [studios, setStudios] = useState([]);
    const [limit, _] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStudios = async currentOffset => {
        setLoadMoreButtonDisabled(true);
        try {
            const studiosRes = await requestDashApi(`/users/${id}/studios?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!studiosRes.ok) throw new Error('Failed to fetch studios');
            const studiosData = await studiosRes.json();
            if (!studiosData.ok) throw new Error(studiosData.error);
            setStudios(prevStudios => [...prevStudios, ...studiosData.studios]);
            setHasMore(studiosData.studios.length === limit);
        } catch (catchedError) {
            setError(catchedError.message);
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

        document.title = `${props.intl.formatMessage(messages.title, {
            username: 'User',
            studiosCount: '?'
        })} - ${APP_NAME}`;

        setLoading(true);
        const fetchData = async () => {
            const userReq = await requestDashApi(`/users/${id}`);
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
            document.title = `${props.intl.formatMessage(messages.title, {
                username: user.user.username,
                studiosCount: user.user.profile.stats.studios
            })} - ${APP_NAME}`;
            setUserData(user.user);
            await fetchStudios(0);
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
    if (!userData || !studios) {
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
                <div className={styles.userStudiosWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{username}'s Studios ({studiosCount})"
                                description="Title of /user-studios page"
                                id="dash.userStudios.title"
                                values={{
                                    username: <a href={`user#${userData.id}`}>{userData.username}</a>,
                                    studiosCount: userData.profile.stats.studios
                                }}
                            />
                        </h2>
                        <div className={styles.studioGrid}>
                            {studios.length > 0 ? studios.map(studio => (
                                <div
                                    key={studio.id}
                                    className={styles.studioCard}
                                    title={props.intl.formatMessage(messages.hoverText, {
                                        author: userData.username,
                                        title: studio.name
                                    })}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => window.open(`./#${studio.id}`, '_blank')}
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
                                    defaultMessage="This user has no studios"
                                    description="Placeholder text when the user has no studios"
                                    id="dash.user.studios.placeholder"
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

UserStudios.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedUserStudios = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(UserStudios));

const WrappedUserStudios = AppStateHOC(ConnectedUserStudios);

render(<WrappedUserStudios />);
