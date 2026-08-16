import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashUserId from '../user/use-hash-user-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './user-following.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    title: {
        defaultMessage: '{username}\'s Following ({followingCount})',
        description: 'Title of /user-following page',
        id: 'dash.userFollowing.title'
    }
});

const UserFollowing = props => {
    const id = useHashUserId();
    const [userData, setUserData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [limit, _] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFollowing = async currentOffset => {
        setLoadMoreButtonDisabled(true);
        try {
            const followingRes = await fetch(`https://api.dashblocks.org/users/${id}/following?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!followingRes.ok) throw new Error('Failed to fetch following');
            const followingData = await followingRes.json();
            if (!followingData.ok) throw new Error(followingData.error);
            setFollowing(prevFollowing => [...prevFollowing, ...followingData.following]);
            setHasMore(followingData.following.length === limit);
        } catch (catchedError) {
            setError(catchedError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    useEffect(() => {
        document.title = `${props.intl.formatMessage(messages.title, {
            username: 'User',
            followingCount: '?'
        })} - ${APP_NAME}`;

        setLoading(true);
        setFollowing([]);
        setHasMore(true);
        setOffset(0);
        setError(null);

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
            document.title = `${props.intl.formatMessage(messages.title, {
                username: user.user.username,
                followingCount: user.user.profile.stats.following
            })} - ${APP_NAME}`;
            setUserData(user.user);
            await fetchFollowing(0);
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
    if (!userData || !following) {
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
                <div className={styles.userFollowingWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{username}'s Following ({followingCount})"
                                description="Title of /user-following page"
                                id="dash.userFollowing.title"
                                values={{
                                    username: <a href={`user#${userData.id}`}>{userData.username}</a>,
                                    followingCount: userData.profile.stats.following
                                }}
                            />
                        </h2>
                        <div className={styles.followList}>
                            {following.length > 0 ? following.map(followed => (
                                <div
                                    key={followed.id}
                                    className={styles.followCard}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => window.open(`./user#${followed.id}`, '_blank')}
                                >
                                    <img
                                        draggable={false}
                                        src={`https://api.dashblocks.org/users/avatars/${followed.profile.avatarId}`}
                                        alt={followed.username}
                                        className={styles.followAvatar}
                                    />
                                    <span className={styles.followUsername}>{followed.username}</span>
                                </div>
                            )) : (
                                <FormattedMessage
                                    defaultMessage="This user is not following anyone"
                                    description="Placeholder text when the user is not following anyone"
                                    id="dash.user.following.placeholder"
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
                                        fetchFollowing(newOffset);
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
                                            description="Button text for loading more items"
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

UserFollowing.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedUserFollowing = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(UserFollowing));

const WrappedUserFollowing = AppStateHOC(ConnectedUserFollowing);

render(<WrappedUserFollowing />);
