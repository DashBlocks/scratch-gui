import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FormattedDate, FormattedMessage, FormattedTime, defineMessages, injectIntl, intlShape} from 'react-intl';
import {API_ORIGIN, requestDashApi} from '../../lib/dash-api';
import FramedAvatar from '../dash-framed-avatar/framed-avatar.jsx';
import * as styles from './comments.css';

const messages = defineMessages({
    placeholder: {
        id: 'dash.comments.placeholder',
        defaultMessage: 'Leave a comment',
        description: 'Comment input label'
    }
});

const Comments = ({className, headerClassName, intl, projectId, session}) => {
    const [comments, setComments] = useState([]);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [postError, setPostError] = useState(null);
    const [retryAfter, setRetryAfter] = useState(0);
    const pending = useRef(false);
    const active = useRef(true);
    const controller = useRef(null);
    const input = useRef(null);
    const previousUser = useRef(session && session.id);

    const release = () => {
        pending.current = false;
    };
    const load = useCallback(async (before = null) => {
        if (pending.current) return;
        pending.current = true;
        setLoading(true);
        setLoadError(false);
        controller.current = new AbortController();
        try {
            const suffix = before === null ? '' : `&before=${before}`;
            const response = await requestDashApi(`/projects/${projectId}/comments?limit=20${suffix}`, {
                signal: controller.current.signal
            });
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error('Could not load comments');
            if (!active.current) return;
            setComments(previous => (before === null ? data.comments : [
                ...previous,
                ...data.comments.filter(comment => !previous.some(item => item.id === comment.id))
            ]));
            setTotal(data.total);
            setNextCursor(data.nextCursor);
            setEnabled(data.enabled);
            setLoaded(true);
        } catch (error) {
            if (active.current && error.name !== 'AbortError') setLoadError(true);
        } finally {
            if (active.current) {
                release();
                setLoading(false);
            }
        }
    }, [projectId]);

    const refresh = useCallback(() => load(), [load]);
    const loadMore = useCallback(() => load(nextCursor), [load, nextCursor]);
    const changeDraft = useCallback(event => setDraft(event.target.value), []);
    const cancel = useCallback(() => {
        setDraft('');
        setPostError(null);
    }, []);

    useEffect(() => {
        load();
        return () => {
            active.current = false;
            if (controller.current) controller.current.abort();
        };
    }, []);

    useEffect(() => {
        if (previousUser.current !== (session && session.id)) {
            previousUser.current = session && session.id;
            setDraft('');
            setPostError(null);
        }
    }, [session && session.id]);

    const publish = useCallback(async event => {
        event.preventDefault();
        if (pending.current || !enabled || !loaded || !session || !session.id || !draft.trim()) return;
        pending.current = true;
        setSending(true);
        setPostError(null);
        controller.current = new AbortController();
        try {
            const response = await requestDashApi(`/projects/${projectId}/comments`, {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({content: draft}),
                signal: controller.current.signal
            });
            const data = await response.json();
            if (!active.current) return;
            if (!response.ok || !data.ok) {
                if (data.code === 'COMMENTS_DISABLED') {
                    setEnabled(false);
                } else if (response.status === 429) {
                    setPostError('wait');
                    setRetryAfter(data.retryAfter || 10);
                } else {
                    setPostError('postError');
                }
                return;
            }
            setComments(previous => [data.comment, ...previous.filter(comment => comment.id !== data.comment.id)]);
            setTotal(data.total);
            setDraft('');
        } catch (error) {
            if (active.current && error.name !== 'AbortError') setPostError('postError');
        } finally {
            if (active.current) {
                release();
                setSending(false);
                if (input.current) input.current.focus();
            }
        }
    }, [enabled, loaded, session, draft, projectId]);

    const commentPlaceholder = intl.formatMessage(messages.placeholder);

    return (
        <section className={className}>
            <div className={headerClassName}>
                <h2>
                    <FormattedMessage
                        id="dash.comments.title"
                        defaultMessage="Comments ({count})"
                        description="Project comments heading"
                        values={{count: total}}
                    />
                </h2>
                <button
                    className={styles.secondaryButton}
                    disabled={loading || sending}
                    type="button"
                    onClick={refresh}
                >
                    <FormattedMessage
                        id="dash.comments.refresh"
                        defaultMessage="Refresh"
                        description="Refresh project comments"
                    />
                </button>
            </div>
            <div className={styles.content}>
                {!enabled && (
                    <p role="status">
                        <FormattedMessage
                            id="dash.comments.disabled"
                            defaultMessage="The Dash Team has temporarily disabled posting comments."
                            description="Global commenting disabled notice"
                        />
                    </p>
                )}
                {enabled && !(session && session.id) && (
                    <p>
                        <FormattedMessage
                            id="dash.comments.login"
                            defaultMessage="Sign in to leave a comment."
                            description="Comment sign-in prompt"
                        />
                    </p>
                )}
                {enabled && session && session.id && (
                    <form className={styles.compose} onSubmit={publish}>
                        <FramedAvatar
                            avatarClassName={styles.avatar}
                            avatarSrc={`${API_ORIGIN}/users/avatars/${session.profile?.avatarId || session.id}`}
                            className={styles.avatarContainer}
                            frameId={session.profile?.avatarFrame}
                        />
                        <div className={styles.body}>
                            <textarea
                                ref={input}
                                aria-label={commentPlaceholder}
                                className={styles.input}
                                disabled={!loaded || sending}
                                maxLength={500}
                                placeholder={commentPlaceholder}
                                rows={3}
                                value={draft}
                                onChange={changeDraft}
                            />
                            <div className={styles.actions}>
                                <button
                                    className={styles.button}
                                    disabled={
                                        !loaded ||
                                        loading ||
                                        sending ||
                                        !draft.trim()
                                    }
                                    type="submit"
                                >
                                    {sending ? (
                                        <FormattedMessage
                                            id="dash.comments.posting"
                                            defaultMessage="Posting..."
                                            description="Comment submission in progress"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            id="dash.comments.post"
                                            defaultMessage="Post"
                                            description="Publish comment button"
                                        />
                                    )}
                                </button>
                                <button
                                    className={styles.secondaryButton}
                                    disabled={sending || !draft}
                                    type="button"
                                    onClick={cancel}
                                >
                                    <FormattedMessage
                                        id="dash.comments.cancel"
                                        defaultMessage="Cancel"
                                        description="Clear comment draft"
                                    />
                                </button>
                                <span className={styles.counter}>
                                    <FormattedMessage
                                        id="dash.comments.count"
                                        defaultMessage="{count} / 500"
                                        description="Comment character count"
                                        values={{count: draft.length}}
                                    />
                                </span>
                            </div>
                            {postError && (
                                <p role="alert">
                                    {postError === "wait" ? (
                                        <FormattedMessage
                                            id="dash.comments.wait"
                                            defaultMessage="Please wait {seconds} seconds before commenting again."
                                            description="Comment rate limit notice"
                                            values={{seconds: retryAfter}}
                                        />
                                    ) : (
                                        <FormattedMessage
                                            id="dash.comments.postError"
                                            defaultMessage="Could not publish your comment."
                                            description="Comment submission error"
                                        />
                                    )}
                                </p>
                            )}
                        </div>
                    </form>
                )}
                {loadError && (
                    <p role="alert">
                        <FormattedMessage
                            id="dash.comments.loadError"
                            defaultMessage="Could not load comments. Try refreshing."
                            description="Comment loading error"
                        />
                    </p>
                )}
                <ul className={styles.list}>
                    {comments.map((comment) => (
                        <li key={comment.id} className={styles.comment}>
                            <FramedAvatar
                                avatarClassName={styles.avatar}
                                avatarSrc={`${API_ORIGIN}/users/avatars/${comment.author.avatarId}`}
                                className={styles.avatarContainer}
                                frameId={comment.author.avatarFrame}
                            />
                            <div className={styles.body}>
                                <div className={styles.metadata}>
                                    {comment.author.id ? (
                                        <a href={`./user#${comment.author.id}`}>
                                            {comment.author.username}
                                        </a>
                                    ) : (
                                        <span>{comment.author.username}</span>
                                    )}
                                    <time dateTime={comment.createdAt}>
                                        <FormattedDate
                                            value={comment.createdAt}
                                        />{" "}
                                        <FormattedTime
                                            value={comment.createdAt}
                                        />
                                    </time>
                                </div>
                                <div className={styles.bubble} dir="auto">
                                    {comment.content}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                {loading && (
                    <p role="status">
                        <FormattedMessage
                            id="dash.comments.loading"
                            defaultMessage="Loading..."
                            description="Loading project comments"
                        />
                    </p>
                )}
                {loaded && comments.length === 0 && !loading && (
                    <p>
                        <FormattedMessage
                            id="dash.comments.empty"
                            defaultMessage="No comments yet."
                            description="Empty project comments"
                        />
                    </p>
                )}
                {nextCursor !== null && (
                    <button
                        className={styles.secondaryButton}
                        disabled={loading || sending}
                        type="button"
                        onClick={loadMore}
                    >
                        <FormattedMessage
                            id="dash.comments.more"
                            defaultMessage="Load more"
                            description="Load older project comments"
                        />
                    </button>
                )}
            </div>
        </section>
    );
};

Comments.propTypes = {
    className: PropTypes.string.isRequired,
    headerClassName: PropTypes.string.isRequired,
    intl: intlShape,
    projectId: PropTypes.string.isRequired,
    session: PropTypes.object
};

export default injectIntl(Comments);
