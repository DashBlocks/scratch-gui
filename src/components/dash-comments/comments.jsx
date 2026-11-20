import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FormattedDate, FormattedMessage, FormattedTime, defineMessages, injectIntl, intlShape} from 'react-intl';
import {API_ORIGIN, requestDashApi} from '../../lib/dash-api';
import decorate from '../../lib/decorate-text.jsx';
import FramedAvatar from '../dash-framed-avatar/framed-avatar.jsx';
import * as styles from './comments.css';

const messages = defineMessages({
    placeholder: {
        id: 'dash.comments.placeholder',
        defaultMessage: 'Leave a comment',
        description: 'Comment input label'
    }
});

const mergeReplies = (current, added) => [...current, ...added.filter(reply =>
    !current.some(entry => entry.id === reply.id)
)].sort((a, b) => a.id - b.id);

const Comments = ({className, headerClassName, intl, targetId, scope, session, onTotalChange}) => {
    const endpoint = `/${scope}/${encodeURIComponent(targetId)}/comments`;
    const [ownerId, setOwnerId] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [replyDraft, setReplyDraft] = useState('');
    const [comments, setComments] = useState([]);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [deleteError, setDeleteError] = useState(false);
    const [rootDraft, setRootDraft] = useState('');
    const draft = replyTo ? replyDraft : rootDraft;
    const setDraft = replyTo ? setReplyDraft : setRootDraft;
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
            const response = await requestDashApi(`${endpoint}?limit=20${suffix}`, {
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
            setOwnerId(data.projectOwnerId);
            setLoaded(true);
        } catch (error) {
            if (active.current && error.name !== 'AbortError') setLoadError(true);
        } finally {
            if (active.current) {
                release();
                setLoading(false);
            }
        }
    }, [endpoint]);

    const refresh = useCallback(() => {
        setReplyTo(null);
        setReplyDraft('');
        setPostError(null);
        load();
    }, [load]);
    const loadMore = useCallback(() => load(nextCursor), [load, nextCursor]);
    const changeDraft = useCallback(event => setDraft(event.target.value), [setDraft]);
    const cancel = useCallback(() => {
        setDraft('');
        setReplyTo(null);
        setPostError(null);
    }, [setDraft]);

    useEffect(() => {
        active.current = true;
        load();
        return () => {
            active.current = false;
            if (controller.current) controller.current.abort();
        };
    }, []);

    useEffect(() => {
        if (previousUser.current !== (session && session.id)) {
            previousUser.current = session && session.id;
            setRootDraft('');
            setReplyDraft('');
            setReplyTo(null);
            setPostError(null);
        }
    }, [session && session.id]);

    useEffect(() => {
        if (loaded && onTotalChange) onTotalChange(total);
    }, [total, loaded, onTotalChange]);

    useEffect(() => {
        if (replyTo && input.current) input.current.focus();
    }, [replyTo]);

    const startReply = useCallback(event => {
        if (pending.current) return;
        const {commentId, username} = event.currentTarget.dataset;
        setReplyTo({id: Number(commentId), username});
        setReplyDraft('');
        setPostError(null);
    }, []);

    const loadReplies = useCallback(async event => {
        if (pending.current) return;
        const {thread, after} = event.currentTarget.dataset;
        pending.current = true;
        setLoading(true);
        setLoadError(false);
        controller.current = new AbortController();
        try {
            const response = await requestDashApi(`${endpoint}?thread=${thread}&after=${after}&limit=20`, {
                signal: controller.current.signal
            });
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error('Could not load replies');
            if (active.current) {
                setComments(previous => previous.map(root => (
                    root.id === Number(thread) ? {
                        ...root, replies: mergeReplies(root.replies, data.replies), nextReplyCursor: data.nextCursor
                    } : root
                )));
            }
        } catch (error) {
            if (active.current && error.name !== 'AbortError') setLoadError(true);
        } finally {
            if (active.current) {
                release();
                setLoading(false);
            }
        }
    }, [endpoint]);

    const publish = useCallback(async event => {
        event.preventDefault();
        if (pending.current || !enabled || !loaded || !session || !session.id || !draft.trim()) return;
        pending.current = true;
        setSending(true);
        setPostError(null);
        controller.current = new AbortController();
        try {
            const response = await requestDashApi(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({content: draft, replyToId: replyTo?.id}),
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
            const entry = data.comment;
            setComments(previous => (entry.threadId ? previous.map(root => (
                root.id === entry.threadId ? {...root, replies: mergeReplies(root.replies, [entry])} : root
            )) : [{...entry, replies: [], nextReplyCursor: null}, ...previous]));
            setReplyTo(null);
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
    }, [enabled, loaded, session, draft, endpoint, replyTo, setDraft]);

    const removeComment = useCallback(async event => {
        if (pending.current || !session?.id) return;
        const commentId = Number(event.currentTarget.dataset.commentId);
        if (!Number.isSafeInteger(commentId) || commentId < 1) return;
        pending.current = true;
        setDeleting(commentId);
        setDeleteError(false);
        controller.current = new AbortController();
        try {
            const response = await requestDashApi(`${endpoint}/${commentId}`, {
                method: 'DELETE',
                credentials: 'include',
                signal: controller.current.signal
            });
            const data = await response.json();
            if (!active.current) return;
            if (!response.ok || !data.ok) {
                setDeleteError(true);
                return;
            }
            const removed = new Set(data.removedIds || [commentId]);
            setComments(previous => previous.filter(root => !removed.has(root.id))
                .map(root => ({...root, replies: root.replies.filter(reply => !removed.has(reply.id))})));
            if (removed.has(replyTo?.id)) {
                setReplyTo(null);
                setReplyDraft('');
            }
            setTotal(data.total);
        } catch (error) {
            if (active.current && error.name !== 'AbortError') setDeleteError(true);
        } finally {
            if (active.current) {
                release();
                setDeleting(null);
            }
        }
    }, [endpoint, session, replyTo]);

    const commentPlaceholder = intl.formatMessage(messages.placeholder);

    const busy = loading || sending || deleting !== null;
    const canDelete = comment => session?.id && (
        session.role === 'dashteam' || String(session.id) === String(comment.author.id) ||
        (scope === 'projects' && String(session.id) === String(ownerId))
    );
    const composer = enabled && session?.id ? (
        <form
            className={styles.compose}
            onSubmit={publish}
        >
            <FramedAvatar
                avatarClassName={styles.avatar}
                avatarSrc={`${API_ORIGIN}/users/avatars/${session.profile?.avatarId || session.id}`}
                className={styles.avatarContainer}
                frameId={session.profile?.avatarFrame}
            />
            <div className={styles.body}>
                {replyTo && (
                    <div className={styles.replyLabel}>
                        <FormattedMessage
                            id="dash.comments.replyingTo"
                            defaultMessage="Reply to @{username}"
                            description="Identifies the recipient of a comment reply"
                            values={{username: replyTo.username}}
                        />
                    </div>
                )}
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
                            deleting !== null ||
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
                        disabled={sending || (!replyTo && !draft)}
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
                        {postError === 'wait' ? (
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
    ) : null;
    const renderComment = comment => (
        <div
            className={styles.comment}
            data-deleting={deleting === comment.id}
        >
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
                        />{' '}
                        <FormattedTime
                            value={comment.createdAt}
                        />
                    </time>
                    {canDelete(comment) && (
                        <div className={styles.commentActions}>
                            <button
                                className={styles.deleteButton}
                                data-comment-id={comment.id}
                                disabled={loading || sending || deleting !== null}
                                type="button"
                                onClick={removeComment}
                            >
                                <span
                                    aria-hidden="true"
                                    className={styles.deleteIcon}
                                />
                                {deleting === comment.id ? (
                                    <FormattedMessage
                                        id="dash.comments.deleting"
                                        defaultMessage="Deleting..."
                                        description="Comment deletion in progress"
                                    />
                                ) : (
                                    <FormattedMessage
                                        id="dash.comments.delete"
                                        defaultMessage="Delete"
                                        description="Delete a comment"
                                    />
                                )}
                            </button>
                        </div>
                    )}
                </div>
                <div
                    className={styles.bubble}
                    dir="auto"
                >
                    {comment.replyTo && (
                        <a href={`./user#${comment.replyTo.authorId}`}>
                            {`@${comment.replyTo.username} `}
                        </a>
                    )}
                    {decorate(comment.content, true)}
                </div>
                {enabled && session?.id && (
                    <button
                        className={styles.replyButton}
                        data-comment-id={comment.id}
                        data-username={comment.author.username}
                        disabled={busy}
                        type="button"
                        onClick={startReply}
                    >
                        <FormattedMessage
                            id="dash.comments.reply"
                            defaultMessage="Reply"
                            description="Reply to a comment"
                        />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <section className={className}>
            <div className={headerClassName}>
                <h2>
                    <FormattedMessage
                        id="dash.comments.title"
                        defaultMessage="Comments ({count})"
                        description="Comments heading"
                        values={{count: total}}
                    />
                </h2>
                <button
                    className={styles.secondaryButton}
                    disabled={loading || sending || deleting !== null}
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
                {!replyTo && composer}
                {loadError && (
                    <p role="alert">
                        <FormattedMessage
                            id="dash.comments.loadError"
                            defaultMessage="Could not load comments. Try refreshing."
                            description="Comment loading error"
                        />
                    </p>
                )}
                {deleteError && (
                    <p role="alert">
                        <FormattedMessage
                            id="dash.comments.deleteError"
                            defaultMessage="Could not delete the comment. Try again."
                            description="Comment deletion error"
                        />
                    </p>
                )}
                <ul className={styles.list}>
                    {comments.map(comment => (
                        <li key={comment.id}>
                            {renderComment(comment)}
                            {replyTo?.id === comment.id && composer}
                            <ul className={styles.replies}>
                                {comment.replies.map(reply => (
                                    <li key={reply.id}>
                                        {renderComment(reply)}
                                        {replyTo?.id === reply.id && composer}
                                    </li>
                                ))}
                            </ul>
                            {comment.nextReplyCursor && (
                                <button
                                    className={styles.secondaryButton}
                                    data-after={comment.nextReplyCursor}
                                    data-thread={comment.id}
                                    disabled={busy}
                                    type="button"
                                    onClick={loadReplies}
                                >
                                    <FormattedMessage
                                        id="dash.comments.moreReplies"
                                        defaultMessage="Show more replies"
                                        description="Load the next replies in this thread"
                                    />
                                </button>
                            )}
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
                {loaded && total === 0 && !loading && (
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
                        disabled={loading || sending || deleting !== null}
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
    onTotalChange: PropTypes.func,
    scope: PropTypes.oneOf(['projects', 'users', 'studios']).isRequired,
    targetId: PropTypes.string.isRequired,
    session: PropTypes.object
};

export default injectIntl(Comments);
