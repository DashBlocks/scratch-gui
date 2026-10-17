import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';

import activity from '../../lib/dash-activity.js';
import * as styles from './control-center.css';

const VERBS = {
    addedSprite: {id: 'dash.activity.addedSprite', defaultMessage: 'added sprite'},
    deletedSprite: {id: 'dash.activity.deletedSprite', defaultMessage: 'deleted sprite'},
    renamedSprite: {id: 'dash.activity.renamedSprite', defaultMessage: 'renamed sprite'},
    duplicatedSprite: {id: 'dash.activity.duplicatedSprite', defaultMessage: 'duplicated sprite'},
    addedCostume: {id: 'dash.activity.addedCostume', defaultMessage: 'added costume'},
    deletedCostume: {id: 'dash.activity.deletedCostume', defaultMessage: 'deleted costume'},
    renamedCostume: {id: 'dash.activity.renamedCostume', defaultMessage: 'renamed costume'},
    duplicatedCostume: {id: 'dash.activity.duplicatedCostume', defaultMessage: 'duplicated costume'},
    editedCostume: {id: 'dash.activity.editedCostume', defaultMessage: 'edited costume'},
    addedBackdrop: {id: 'dash.activity.addedBackdrop', defaultMessage: 'added backdrop'},
    addedSound: {id: 'dash.activity.addedSound', defaultMessage: 'added sound'},
    deletedSound: {id: 'dash.activity.deletedSound', defaultMessage: 'deleted sound'},
    renamedSound: {id: 'dash.activity.renamedSound', defaultMessage: 'renamed sound'},
    duplicatedSound: {id: 'dash.activity.duplicatedSound', defaultMessage: 'duplicated sound'},
    editedSound: {id: 'dash.activity.editedSound', defaultMessage: 'edited sound'},
    sharedBlocks: {id: 'dash.activity.sharedBlocks', defaultMessage: 'shared blocks'},
    sharedCostume: {id: 'dash.activity.sharedCostume', defaultMessage: 'shared costume'},
    sharedSound: {id: 'dash.activity.sharedSound', defaultMessage: 'shared sound'},
    reorderedSprites: {id: 'dash.activity.reorderedSprites', defaultMessage: 'reordered sprites'},
    reorderedCostumes: {id: 'dash.activity.reorderedCostumes', defaultMessage: 'reordered costumes'},
    reorderedSounds: {id: 'dash.activity.reorderedSounds', defaultMessage: 'reordered sounds'},
    changedProject: {id: 'dash.activity.changedProject', defaultMessage: 'changed the project'},
    undidAction: {id: 'dash.activity.undidAction', defaultMessage: 'undid their change to'},
    startedPresentation: {id: 'dash.activity.startedPresentation', defaultMessage: 'started the presentation'},
    stoppedPresentation: {id: 'dash.activity.stoppedPresentation', defaultMessage: 'ended the presentation'},
    grantedSpeech: {id: 'dash.activity.grantedSpeech', defaultMessage: 'gave speech to'},
    removedUser: {id: 'dash.activity.removedUser', defaultMessage: 'removed'},
    bannedUser: {id: 'dash.activity.bannedUser', defaultMessage: 'banned'},
    raisedHand: {id: 'dash.activity.raisedHand', defaultMessage: 'raised their hand'},
    restoredEntry: {id: 'dash.activity.restoredEntry', defaultMessage: 'restored an earlier state of'},
    joined: {id: 'dash.activity.joined', defaultMessage: 'joined the session'},
    left: {id: 'dash.activity.left', defaultMessage: 'left the session'}
};

const ICONS = {
    sprite: '\u{1F47E}',
    costume: '\u{1F58C}',
    sound: '\u{1F3B5}',
    people: '\u{1F465}',
    present: '\u{1F3A4}',
    undo: '\u{21A9}',
    edit: '\u{270F}'
};

const formatTime = ts => {
    const date = new Date(ts);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

class ActivityFeed extends React.Component {
    constructor (props) {
        super(props);
        this.state = {tick: 0, busy: false, error: null, expanded: null};
        this.unsubscribe = null;
        bindAll(this, ['handleTick', 'handleUndo', 'handleUndoEntry', 'handleRestoreEntry', 'handleToggleExpand']);
    }
    componentDidMount () {
        this.unsubscribe = activity.subscribe(this.handleTick);
    }
    componentWillUnmount () {
        if (this.unsubscribe) this.unsubscribe();
    }
    handleTick () {
        this.setState({tick: this.state.tick + 1});
    }
    handleToggleExpand (entryId) {
        this.setState({expanded: this.state.expanded === entryId ? null : entryId});
    }
    async handleUndo () {
        if (this.state.busy) return;
        this.setState({busy: true, error: null});
        try {
            await activity.undoEntry(null);
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({busy: false});
        }
    }
    async handleUndoEntry (entryId) {
        if (this.state.busy) return;
        this.setState({busy: true, error: null});
        try {
            await activity.undoEntry(entryId);
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({busy: false});
        }
    }
    async handleRestoreEntry (entryId) {
        if (this.state.busy) return;
        this.setState({busy: true, error: null});
        try {
            await activity.restoreEntry(entryId);
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({busy: false});
        }
    }
    renderDiff (entry) {
        const diff = entry.diff;
        if (!diff) return null;
        return (
            <div className={styles.diffPanel}>
                {typeof diff.before === 'string' && typeof diff.after === 'string' ? (
                    <div className={styles.diffLine}>
                        <span className={styles.diffBefore}>{diff.before ? `\u2190 "${diff.before}"` : '\u2190 (new)'}</span>
                        <span className={styles.diffArrow}>{' \u27A1 '}</span>
                        <span className={styles.diffAfter}>{diff.after ? `"${diff.after}"` : '(deleted)'}</span>
                    </div>
                ) : null}
                {typeof diff.before === 'string' && diff.after === null ? (
                    <div className={styles.diffLine}>
                        <span className={styles.diffBefore}>{`\u2190 "${diff.before}"`}</span>
                        <span className={styles.diffArrow}>{' \u27A1 '}</span>
                        <span className={styles.diffAfter}>{'(deleted)'}</span>
                    </div>
                ) : null}
                {diff.before === null && typeof diff.after === 'string' ? (
                    <div className={styles.diffLine}>
                        <span className={styles.diffBefore}>{'\u2190 (new)'}</span>
                        <span className={styles.diffArrow}>{' \u27A1 '}</span>
                        <span className={styles.diffAfter}>{`"${diff.after}"`}</span>
                    </div>
                ) : null}
                {diff.summary ? (
                    <div className={styles.diffSummary}>{diff.summary}</div>
                ) : null}
            </div>
        );
    }
    renderEntry (entry) {
        const verb = VERBS[entry.verb] || VERBS.changedProject;
        const expanded = this.state.expanded === entry.id;
        const expandable = Boolean(entry.diff);
        return (
            <div
                className={`${styles.feedEntry} ${entry.undoable || entry.hasRestore ? styles.feedHighlight : ''} ${expandable ? styles.feedEntryExpandable : ''}`}
                key={entry.id}
            >
                <div
                    className={styles.feedIcon}
                    onClick={expandable ? () => this.handleToggleExpand(entry.id) : undefined}
                >
                    {ICONS[entry.icon] || ICONS.edit}
                </div>
                <div
                    className={styles.feedText}
                    onClick={expandable ? () => this.handleToggleExpand(entry.id) : undefined}
                >
                    <strong>{entry.username === 'self' ? 'You' : entry.username}</strong>
                    {' '}
                    {this.props.intl.formatMessage(verb)}
                    {entry.targetName ? ` "${entry.targetName}"` : ''}
                    {entry.extraName && entry.verb && entry.verb.indexOf('renamed') === 0 ? ` (${entry.extraName})` : ''}
                    {expanded ? this.renderDiff(entry) : null}
                </div>
                {entry.undoable && (
                    <button
                        className={styles.smallButton}
                        type="button"
                        disabled={this.state.busy}
                        onClick={() => this.handleUndoEntry(entry.id)}
                    >
                        <FormattedMessage
                            defaultMessage="Undo"
                            description="Button to undo this specific own action"
                            id="dash.activity.undoEntry"
                        />
                    </button>
                )}
                {entry.hasRestore && (
                    <button
                        className={styles.smallButton}
                        type="button"
                        disabled={this.state.busy}
                        onClick={() => this.handleRestoreEntry(entry.id)}
                    >
                        <FormattedMessage
                            defaultMessage="Restore"
                            description="Button to restore the before state of this change"
                            id="dash.activity.restoreEntry"
                        />
                    </button>
                )}
                <div className={styles.feedTime}>{formatTime(entry.ts)}</div>
            </div>
        );
    }
    render () {
        const {entries, undoable} = activity.getState();
        return (
            <React.Fragment>
                {undoable.length > 0 && (
                    <div className={styles.undoBar}>
                        <span>
                            <FormattedMessage
                                defaultMessage="You have {count} change(s) that only you can undo"
                                description="Personal undo hint"
                                id="dash.activity.undoHint"
                                values={{count: undoable.length}}
                            />
                        </span>
                        <button
                            className={styles.primaryButton}
                            disabled={this.state.busy}
                            type="button"
                            onClick={this.handleUndo}
                        >
                            <FormattedMessage
                                defaultMessage="Undo my last change"
                                description="Button to undo the last own action"
                                id="dash.activity.undoLast"
                            />
                        </button>
                    </div>
                )}
                {this.state.error ? <p role="alert">{this.state.error}</p> : null}
                {entries.length === 0 ? (
                    <div className={styles.feedEmpty}>
                        <FormattedMessage
                            defaultMessage="Session activity will appear here: edits, presentation and people joining."
                            description="Empty state of the activity feed"
                            id="dash.activity.empty"
                        />
                    </div>
                ) : (
                    <div className={styles.feedList}>
                        {entries.slice(0, 60).map(entry => this.renderEntry(entry))}
                    </div>
                )}
            </React.Fragment>
        );
    }
}

ActivityFeed.propTypes = {
    vm: PropTypes.object,
    intl: intlShape
};

export default injectIntl(ActivityFeed);
