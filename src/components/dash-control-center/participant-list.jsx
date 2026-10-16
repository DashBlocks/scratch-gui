import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import {listenPresence} from '../../lib/dash-presence.js';
import sessionControl from '../../lib/dash-session-control.js';
import viewState from '../../lib/dash-view-state.js';
import * as styles from './control-center.css';

const presenceColor = idString => {
    let hash = 0;
    const value = String(idString);
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return `hsl(${Math.abs(hash) % 360}, 72%, 50%)`;
};

const initials = name => {
    const trimmed = String(name || '?').trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    return ((parts[0][0] || '?') + (parts[1] ? parts[1][0] : '')).toUpperCase();
};

const ROLE_LABELS = {
    owner: {className: 'roleOwner'},
    editor: {className: 'roleEditor'},
    viewer: {className: 'roleViewer'}
};

const RoleMessage = ({role}) => {
    switch (role) {
    case 'owner': return (
        <FormattedMessage
            defaultMessage="Owner"
            description="Role badge on a participant row"
            id="dash.controlCenter.roleOwner"
        />
    );
    case 'editor': return (
        <FormattedMessage
            defaultMessage="Editor"
            description="Role badge on a participant row"
            id="dash.controlCenter.roleEditor"
        />
    );
    default: return (
        <FormattedMessage
            defaultMessage="Viewer"
            description="Role badge on a participant row"
            id="dash.controlCenter.roleViewer"
        />
    );
    }
};

RoleMessage.propTypes = {
    role: PropTypes.string
};

class ParticipantList extends React.Component {
    constructor (props) {
        super(props);
        this.state = {tick: 0};
        this.unsubscribe = null;
        bindAll(this, ['handleTick', 'handleFollow']);
    }
    componentDidMount () {
        this.unsubscribe = listenPresence(this.props.vm, this.handleTick);
    }
    componentWillUnmount () {
        if (this.unsubscribe) this.unsubscribe();
    }
    handleTick () {
        this.setState({tick: this.state.tick + 1});
    }
    handleFollow (key) {
        if (viewState.getFollowTarget() === key) {
            viewState.setFollowTarget(null);
        } else {
            viewState.setFollowTarget(key);
        }
    }
    mergedRows () {
        const presence = this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.presence;
        const members = presence ? presence.getMembers() : [];
        const peers = presence ? presence.getPeers() : [];
        const peerByUser = new Map();
        for (const peer of peers) {
            peerByUser.set(peer.userId || peer.id, peer);
        }
        const rows = [];
        const seen = new Set();
        for (const member of members) {
            const key = member.connectionId || member.userId;
            seen.add(String(member.userId));
            const peer = peerByUser.get(member.userId);
            rows.push({
                key,
                userId: member.userId,
                username: member.username,
                role: member.role,
                online: true,
                color: presenceColor(member.userId),
                viewTarget: peer && peer.state && peer.state.view ? peer.state.view.targetName : null,
                self: Boolean(presence && presence.selfUserId && String(member.userId) === String(presence.selfUserId))
            });
        }
        // Offline collaborators from the management list.
        for (const collaborator of this.props.collaborators || []) {
            const id = String(collaborator.userId || collaborator.id || '');
            if (!id || seen.has(id)) continue;
            rows.push({
                key: `offline-${id}`,
                userId: id,
                username: collaborator.username || id,
                role: collaborator.role || 'editor',
                online: false,
                color: presenceColor(id),
                viewTarget: null,
                self: false
            });
        }
        // Keep the local user first, then online, then offline.
        rows.sort((a, b) => {
            if (a.self !== b.self) return a.self ? -1 : 1;
            if (a.online !== b.online) return a.online ? -1 : 1;
            return String(a.username).localeCompare(String(b.username));
        });
        return rows;
    }
    renderRoleBadge (role) {
        const meta = ROLE_LABELS[role] || ROLE_LABELS.viewer;
        return (
            <span className={`${styles.roleBadge} ${styles[meta.className]}`}>
                <RoleMessage role={role} />
            </span>
        );
    }
    renderActions (row) {
        const control = sessionControl.getState();
        const following = viewState.getFollowTarget() === row.key;
        const actions = [];
        if (!row.self) {
            actions.push(
                <button
                    className={`${styles.smallButton} ${following ? styles.smallButtonActive : ''}`}
                    key="follow"
                    type="button"
                    onClick={() => this.handleFollow(row.key)}
                >
                    {following ? (
                        <FormattedMessage
                            defaultMessage="Following ✓"
                            description="Button state: following this participant"
                            id="dash.controlCenter.following"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Follow"
                            description="Button to follow this participant's view"
                            id="dash.controlCenter.follow"
                        />
                    )}
                </button>
            );
        }
        if (control.presenting && !row.self && (control.handRaiseList || []).some(entry => entry.userId === row.userId)) {
            actions.push(
                <button
                    className={styles.smallButton}
                    key="grant"
                    type="button"
                    onClick={() => sessionControl.grantSpeech(row.userId)}
                >
                    <FormattedMessage
                        defaultMessage="Give speech"
                        description="Button to let a participant speak"
                        id="dash.controlCenter.grantSpeechRow"
                    />
                </button>
            );
        }
        if (this.props.canManage && control.isOwner && !row.self && row.role !== 'owner') {
            actions.push(
                <button
                    className={styles.smallButton}
                    key="role"
                    type="button"
                    onClick={() => this.props.onRoleChange(row.username, row.role === 'viewer' ? 'editor' : 'viewer')}
                >
                    {row.role === 'viewer' ? (
                        <FormattedMessage
                            defaultMessage="Make editor"
                            description="Button to promote a viewer to editor"
                            id="dash.controlCenter.makeEditor"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Make viewer"
                            description="Button to demote an editor to viewer"
                            id="dash.controlCenter.makeViewer"
                        />
                    )}
                </button>
            );
            actions.push(
                <button
                    className={`${styles.smallButton} ${styles.smallButtonDanger}`}
                    key="kick"
                    type="button"
                    onClick={() => this.props.onKick(row.userId, row.username)}
                >
                    <FormattedMessage
                        defaultMessage="Remove"
                        description="Button to remove a collaborator"
                        id="dash.controlCenter.remove"
                    />
                </button>
            );
            actions.push(
                <button
                    className={`${styles.smallButton} ${styles.smallButtonDanger}`}
                    key="ban"
                    type="button"
                    onClick={() => this.props.onBan(row.userId, row.username)}
                >
                    <FormattedMessage
                        defaultMessage="Ban"
                        description="Button to remove and ban a collaborator"
                        id="dash.controlCenter.ban"
                    />
                </button>
            );
        }
        return actions;
    }
    render () {
        const rows = this.mergedRows();
        const control = sessionControl.getState();
        return (
            <React.Fragment>
                <div className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Participants"
                        description="Title of the participant list"
                        id="dash.controlCenter.participantsTitle"
                    />
                    <span>{rows.filter(row => row.online).length} online</span>
                </div>
                {this.props.error ? (
                    <p role="alert">{this.props.error}</p>
                ) : null}
                <div className={styles.participantList}>
                    {rows.map(row => {
                        const isPresenter = control.presentationActive &&
                            ((control.presenterName === 'self' && row.self) ||
                             (control.presenterName && control.presenterName === row.username));
                        return (
                            <div
                                className={`${styles.participantRow} ${row.self ? styles.participantRowSelf : ''}`}
                                key={row.key}
                            >
                                <div className={`${styles.avatar} ${isPresenter ? styles.avatarPresenter : ''}`} style={{background: row.color}}>
                                    {initials(row.username)}
                                    <span className={`${styles.avatarDot} ${row.online ? '' : styles.avatarDotOffline}`} />
                                </div>
                                <div className={styles.participantInfo}>
                                    <div className={styles.participantNameRow}>
                                        <span className={styles.participantName}>{row.username}</span>
                                        {row.role === 'owner' && (
                                            <span className={styles.crown}>{'\u{1F451}'}</span>
                                        )}
                                        {row.self && (
                                            <span className={styles.youTag}>
                                                <FormattedMessage
                                                    defaultMessage="You"
                                                    description="Badge marking the local user"
                                                    id="dash.controlCenter.you"
                                                />
                                            </span>
                                        )}
                                        {this.renderRoleBadge(row.role)}
                                    </div>
                                    <div className={styles.participantMeta}>
                                        {row.online ? (
                                            row.viewTarget ? (
                                                <FormattedMessage
                                                    defaultMessage="Looking at: {name}"
                                                    description="Which sprite a participant currently has open"
                                                    id="dash.controlCenter.lookingAt"
                                                    values={{name: row.viewTarget}}
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="In session"
                                                    description="Participant is connected"
                                                    id="dash.controlCenter.inSession"
                                                />
                                            )
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Offline"
                                                description="Participant is not connected"
                                                id="dash.controlCenter.offline"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className={styles.participantActions}>
                                    {this.renderActions(row)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </React.Fragment>
        );
    }
}

ParticipantList.propTypes = {
    vm: PropTypes.object.isRequired,
    collaborators: PropTypes.array,
    canManage: PropTypes.bool,
    busy: PropTypes.bool,
    error: PropTypes.string,
    onKick: PropTypes.func,
    onBan: PropTypes.func,
    onRoleChange: PropTypes.func,
    onReload: PropTypes.func
};

ParticipantList.defaultProps = {
    collaborators: [],
    canManage: false
};

export default ParticipantList;
