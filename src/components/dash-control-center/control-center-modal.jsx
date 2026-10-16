import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';

import {listenPresence} from '../../lib/dash-presence.js';
import sessionControl from '../../lib/dash-session-control.js';
import activity from '../../lib/dash-activity.js';
import viewState from '../../lib/dash-view-state.js';
import {requestDashApi} from '../../lib/dash-api.js';
import DashChat from '../dash-chat/dash-chat.jsx';
import ParticipantList from './participant-list.jsx';
import ActivityFeed from './activity-feed.jsx';
import * as styles from './control-center.css';

const TABS = ['participants', 'activity', 'chat'];

class ControlCenterModal extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            tab: 'participants',
            tick: 0,
            collaborators: null,
            busy: false,
            error: null
        };
        this.unsubscribeList = [];
        bindAll(this, [
            'handleTick',
            'handleClose',
            'handleTab',
            'handleStartPresentation',
            'handleStopPresentation',
            'handleKick',
            'handleBan',
            'handleRoleChange',
            'handleCopyInvite',
            'loadCollaborators'
        ]);
    }
    componentDidMount () {
        this.unsubscribeList.push(sessionControl.subscribe(this.handleTick));
        this.unsubscribeList.push(activity.subscribe(this.handleTick));
        this.unsubscribeList.push(viewState.subscribe(this.handleTick));
        this.unsubscribeList.push(listenPresence(this.props.vm, this.handleTick));
        this.loadCollaborators();
    }
    componentWillUnmount () {
        for (const unsubscribe of this.unsubscribeList) unsubscribe();
    }
    handleTick () {
        this.setState({tick: this.state.tick + 1});
    }
    handleClose () {
        if (this.props.onClose) this.props.onClose();
    }
    handleTab (tab) {
        this.setState({tab});
    }
    async loadCollaborators () {
        if (!this.props.canManage || !this.props.projectId) return;
        try {
            const response = await requestDashApi(
                `/projects/${String(this.props.projectId)}/collaborators`,
                {credentials: 'include'}
            );
            if (!response.ok) throw new Error(`(${response.status})`);
            const data = await response.json();
            this.setState({collaborators: data.collaborators || data || []});
        } catch (error) {
            this.setState({collaborators: []});
        }
    }
    handleStartPresentation () {
        sessionControl.startPresentation();
        activity.recordSession({kind: 'presentation', verb: 'startedPresentation', icon: 'present'});
    }
    handleStopPresentation () {
        sessionControl.stopPresentation();
        activity.recordSession({kind: 'presentation', verb: 'stoppedPresentation', icon: 'present'});
    }
    async handleKick (userId, username) {
        if (this.state.busy) return;
        this.setState({busy: true, error: null});
        try {
            await sessionControl.kickUser(userId, {username, ban: false});
            activity.recordSession({
                kind: 'kick',
                verb: 'removedUser',
                icon: 'people',
                targetName: username
            });
            await this.loadCollaborators();
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({busy: false});
        }
    }
    async handleBan (userId, username) {
        if (this.state.busy) return;
        this.setState({busy: true, error: null});
        try {
            await sessionControl.kickUser(userId, {username, ban: true});
            activity.recordSession({
                kind: 'ban',
                verb: 'bannedUser',
                icon: 'people',
                targetName: username
            });
            await this.loadCollaborators();
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({busy: false});
        }
    }
    async handleRoleChange (username, role) {
        if (this.state.busy) return;
        this.setState({busy: true, error: null});
        try {
            const response = await requestDashApi(
                `/projects/${String(this.props.projectId)}/collaborators`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username, role})
                }
            );
            if (!response.ok) throw new Error(`(${response.status})`);
            await this.loadCollaborators();
        } catch (error) {
            this.setState({error: error.message});
        } finally {
            this.setState({busy: false});
        }
    }
    handleCopyInvite () {
        const url = `${window.location.origin}${window.location.pathname}?projectId=${String(this.props.projectId)}`;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url);
            } else {
                const input = this.inviteInput;
                if (input) {
                    input.select();
                    document.execCommand('copy');
                }
            }
        } catch (error) {
            // Clipboard can be unavailable; the input stays selectable.
        }
    }
    renderPresentationStrip () {
        const control = sessionControl.getState();
        const isPresenter = control.presenting || (control.isOwner && control.presentationActive);
        return (
            <div className={`${styles.presenterStrip} ${control.presentationActive ? styles.presenterStripLive : ''}`}>
                {control.presentationActive ? (
                    <span className={styles.presenterLabel}>
                        {control.presenterName === 'self' ? (
                            <FormattedMessage
                                defaultMessage="Live presentation: you are the presenter"
                                description="Presentation status strip when the local user presents"
                                id="dash.controlCenter.presentationLiveSelf"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Live presentation: {name} is presenting"
                                description="Presentation status strip"
                                id="dash.controlCenter.presentationLive"
                                values={{
                                    name: control.presenterName || '...'
                                }}
                            />
                        )}
                    </span>
                ) : (
                    <span className={styles.presenterLabel}>
                        <FormattedMessage
                            defaultMessage="Presentation mode: everyone follows the presenter and viewers can raise a hand"
                            description="Presentation idle status strip"
                            id="dash.controlCenter.presentationIdle"
                        />
                    </span>
                )}
                {control.isOwner && !control.presentationActive && (
                    <button
                        className={`${styles.presenterAction} ${styles.presenterActionPrimary}`}
                        type="button"
                        onClick={this.handleStartPresentation}
                    >
                        <FormattedMessage
                            defaultMessage="Start presentation"
                            description="Button to start presenter mode"
                            id="dash.controlCenter.startPresentation"
                        />
                    </button>
                )}
                {control.isOwner && control.presentationActive && (
                    <button
                        className={styles.presenterAction}
                        type="button"
                        onClick={this.handleStopPresentation}
                    >
                        <FormattedMessage
                            defaultMessage="End"
                            description="Button to end presenter mode"
                            id="dash.controlCenter.stopPresentation"
                        />
                    </button>
                )}
                {!control.isOwner && control.presentationActive && !isPresenter && (
                    <button
                        className={`${styles.presenterAction} ${control.handRaised ? styles.presenterActionPrimary : ''}`}
                        type="button"
                        onClick={() => {
                            sessionControl.requestSpeech();
                            if (!control.handRaised) {
                                activity.recordSession({kind: 'speech', verb: 'raisedHand', icon: 'present'});
                            }
                        }}
                    >
                        {control.handRaised ? (
                            <FormattedMessage
                                defaultMessage="Hand raised ✓"
                                description="Button state: speech requested"
                                id="dash.controlCenter.handRaised"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Raise hand"
                                description="Button to request speech"
                                id="dash.controlCenter.raiseHand"
                            />
                        )}
                    </button>
                )}
            </div>
        );
    }
    renderHandQueue () {
        const control = sessionControl.getState();
        const queue = control.handRaiseList || [];
        if (!queue.length || !control.presenting) return null;
        return (
            <div className={styles.queueBox}>
                <div className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Hands raised"
                        description="Title of the speech-request queue"
                        id="dash.controlCenter.handsRaised"
                    />
                </div>
                {queue.map(entry => (
                    <div className={styles.queueRow} key={entry.userId}>
                        <span className={styles.queueName}>{entry.self ? 'You' : entry.username}</span>
                        <button
                            className={styles.smallButton}
                            type="button"
                            onClick={() => {
                                sessionControl.grantSpeech(entry.userId);
                                activity.recordSession({
                                    kind: 'speech',
                                    verb: 'grantedSpeech',
                                    icon: 'present',
                                    targetName: entry.self ? 'You' : entry.username
                                });
                            }}
                        >
                            <FormattedMessage
                                defaultMessage="Give speech"
                                description="Button to let a participant speak"
                                id="dash.controlCenter.grantSpeech"
                            />
                        </button>
                    </div>
                ))}
            </div>
        );
    }
    renderBody () {
        switch (this.state.tab) {
        case 'activity':
            return <ActivityFeed />;
        case 'chat':
            return (
                <div className={styles.chatWrap}>
                    <DashChat vm={this.props.vm} />
                </div>
            );
        default:
            return (
                <React.Fragment>
                    {this.renderHandQueue()}
                    <ParticipantList
                        busy={this.state.busy}
                        collaborators={this.state.collaborators}
                        canManage={this.props.canManage}
                        error={this.state.error}
                        vm={this.props.vm}
                        onBan={this.handleBan}
                        onKick={this.handleKick}
                        onReload={this.loadCollaborators}
                        onRoleChange={this.handleRoleChange}
                    />
                    {this.props.canManage && (
                        <React.Fragment>
                            <div className={styles.sectionTitle}>
                                <FormattedMessage
                                    defaultMessage="Invite"
                                    description="Title of the invite section"
                                    id="dash.controlCenter.inviteTitle"
                                />
                            </div>
                            <div className={styles.inviteBox}>
                                <input
                                    readOnly
                                    className={styles.inviteInput}
                                    ref={ref => {
                                        this.inviteInput = ref;
                                    }}
                                    value={`${window.location.origin}${window.location.pathname}?projectId=${String(this.props.projectId)}`}
                                />
                                <button
                                    className={styles.primaryButton}
                                    type="button"
                                    onClick={this.handleCopyInvite}
                                >
                                    <FormattedMessage
                                        defaultMessage="Copy link"
                                        description="Button to copy the collaboration invite link"
                                        id="dash.controlCenter.copyLink"
                                    />
                                </button>
                            </div>
                        </React.Fragment>
                    )}
                </React.Fragment>
            );
        }
    }
    render () {
        const control = sessionControl.getState();
        const activityState = activity.getState();
        return (
            <div
                className={styles.overlay}
                role="presentation"
                onMouseDown={event => {
                    if (event.target === event.currentTarget) this.handleClose();
                }}
            >
                <div
                    aria-label={this.props.intl.formatMessage({
                        id: 'dash.controlCenter.title',
                        defaultMessage: 'Collaboration control center',
                        description: 'Accessibility label for the control center modal'
                    })}
                    aria-modal="true"
                    className={styles.modal}
                    role="dialog"
                >
                    <div className={styles.header}>
                        <div className={styles.headerIcon}>{'\u{1F465}'}</div>
                        <div className={styles.headerTitles}>
                            <div className={styles.headerTitle}>
                                <FormattedMessage
                                    defaultMessage="Collaboration"
                                    description="Title of the collaboration control center"
                                    id="dash.controlCenter.header"
                                />
                            </div>
                            <div className={styles.headerSubtitle}>
                                <FormattedMessage
                                    defaultMessage="Roles, presentation, activity and chat in one place"
                                    description="Subtitle of the collaboration control center"
                                    id="dash.controlCenter.subheader"
                                />
                            </div>
                        </div>
                        <button
                            aria-label="close"
                            className={styles.closeButton}
                            type="button"
                            onClick={this.handleClose}
                        >
                            {'\u2715'}
                        </button>
                    </div>
                    {this.renderPresentationStrip()}
                    <div className={styles.tabs}>
                        {TABS.map(tab => (
                            <button
                                className={`${styles.tab} ${this.state.tab === tab ? styles.tabActive : ''}`}
                                key={tab}
                                type="button"
                                onClick={() => this.handleTab(tab)}
                            >
                                {tab === 'participants' && (
                                    <FormattedMessage
                                        defaultMessage="Participants"
                                        description="Participants tab"
                                        id="dash.controlCenter.tabParticipants"
                                    />
                                )}
                                {tab === 'activity' && (
                                    <React.Fragment>
                                        <FormattedMessage
                                            defaultMessage="Activity"
                                            description="Activity tab"
                                            id="dash.controlCenter.tabActivity"
                                        />
                                        {activityState.undoable.length > 0 && (
                                            <span className={styles.tabBadge}>
                                                {activityState.undoable.length}
                                            </span>
                                        )}
                                    </React.Fragment>
                                )}
                                {tab === 'chat' && (
                                    <FormattedMessage
                                        defaultMessage="Chat"
                                        description="Chat tab"
                                        id="dash.controlCenter.tabChat"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className={styles.body}>
                        {this.renderBody()}
                    </div>
                </div>
            </div>
        );
    }
}

ControlCenterModal.propTypes = {
    vm: PropTypes.object.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    canManage: PropTypes.bool,
    isRtl: PropTypes.bool,
    onClose: PropTypes.func,
    intl: intlShape
};

ControlCenterModal.defaultProps = {
    canManage: false,
    isRtl: false
};

export default injectIntl(ControlCenterModal);
