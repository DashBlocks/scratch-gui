import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import useHashUserId from '../user/use-hash-user-id.jsx';
import {connect} from 'react-redux';
import {FormattedMessage, FormattedDate, FormattedRelative, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './user-followers.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import getSession from '../../lib/session.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

// Browser support is not perfect yet
const relativeTimeSupported = () => typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined';

const messages = defineMessages({
    title: {
        defaultMessage: '{username}\'s Followers ({followersCount})',
        description: 'Title of /user-followers page',
        id: 'dash.userFollowers.title'
    }
});

const UserFollowers = (props) => {
    const id = useHashUserId();
    const [userData, setUserData] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [limit, setLimit] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = props.intl.formatMessage(messages.title, {
            username: 'User',
            followersCount: '?'
        }) + ' - ' + APP_NAME;

        setLoading(true);
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
            document.title = props.intl.formatMessage(messages.title, {
                username: user.user.username,
                followersCount: user.user.profile.stats.followers
            }) + ' - ' + APP_NAME;
            setUserData(user.user);
            await fetchFollowers(0);
            setLoading(false);
        }
        fetchData();
    }, []);

    const fetchFollowers = async (currentOffset) => {
        setLoadMoreButtonDisabled(true);
        try {
            const followersRes = await fetch(`https://api.dashblocks.org/users/${id}/followers?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!followersRes.ok) throw new Error('Failed to fetch followers');
            const followersData = await followersRes.json();
            if (!followersData.ok) throw new Error(followersData.error);
            setFollowers(prevFollowers => [...prevFollowers, ...followersData.followers]);
            setHasMore(followersData.followers.length === limit);
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
    if (!userData || !followers) return (
        <>
            <LazyMenuBar />
            <div>Failed to load user data</div>
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
                <div className={styles.userFollowersWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="{username}'s Followers ({followersCount})"
                                description="Title of /user-followers page"
                                id="dash.userFollowers.title"
                                values={{
                                    username: <a href={`user#${userData.id}`}>{userData.username}</a>,
                                    followersCount: userData.profile.stats.followers
                                }}
                            />
                        </h2>
                        <div className={styles.followList}>
                            {followers.length > 0 ? followers.map((follower) => (
                                <div
                                    key={follower.id}
                                    className={styles.followCard}
                                    onClick={() => window.open(`./user#${follower.id}`, '_blank')}
                                >
                                    <img
                                        draggable={false}
                                        src={`https://api.dashblocks.org/users/avatars/${follower.profile.avatarId}`}
                                        alt={follower.username}
                                        className={styles.followAvatar}
                                    />
                                    <span className={styles.followUsername}>{follower.username}</span>
                                </div>
                            )) : (
                                <FormattedMessage
                                    defaultMessage="This user has no followers"
                                    description="Placeholder text when the user has no followers"
                                    id="dash.user.followers.placeholder"
                                />
                            )}
                            {hasMore && (
                                <Button
                                    className={styles.loadMoreButton}
                                    disabled={loadMoreButtonDisabled}
                                    onClick={() => {
                                        const newOffset = offset + limit;
                                        setOffset(newOffset);
                                        fetchFollowers(newOffset);
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

UserFollowers.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedUserFollowers = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(UserFollowers));

const WrappedUserFollowers = AppStateHOC(ConnectedUserFollowers);

render(<WrappedUserFollowers />);
