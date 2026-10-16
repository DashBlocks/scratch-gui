import PropTypes from 'prop-types';
import React from 'react';

import {listenPresence, presenceColor} from '../../lib/dash-presence.js';
import * as styles from './presence-avatars.css';

const MAX_AVATARS = 5;

/**
 * Compact avatar stack for the menu bar showing who is in the live-collaboration
 * session and who is currently online (sending presence).
 */
class PresenceAvatars extends React.Component {
    constructor (props) {
        super(props);
        this.state = {version: 0};
        this.handlePresenceChange = this.handlePresenceChange.bind(this);
        this.detachPresence = null;
    }
    componentDidMount () {
        this.detachPresence = listenPresence(this.props.vm, this.handlePresenceChange);
    }
    componentWillUnmount () {
        if (this.detachPresence) this.detachPresence();
    }
    handlePresenceChange () {
        this.setState({version: this.state.version + 1});
    }
    getPresence () {
        return (this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.presence) || null;
    }
    render () {
        const session = this.props.vm.dashCollaboration;
        if (!session) return null;
        const presence = this.getPresence();
        const onlinePeers = presence ? presence.getPeers() : [];
        const onlineByUser = new Map();
        for (const peer of onlinePeers) {
            if (peer.userId) onlineByUser.set(peer.userId, peer);
        }
        const client = session.client || {};
        const seen = new Set();
        const entries = [];
        for (const member of session.members || []) {
            const id = member.connectionId || member.userId;
            if (!id || seen.has(member.userId)) continue;
            seen.add(member.userId);
            entries.push({
                id,
                username: member.username,
                role: member.role,
                online: Boolean(onlineByUser.get(member.userId)) ||
                    (member.userId === client.userId && session.state === 'connected'),
                self: member.userId === client.userId
            });
        }
        if (!entries.length) return null;
        const visible = entries.slice(0, MAX_AVATARS);
        const overflow = entries.length - visible.length;
        return (
            <div className={styles.avatars}>
                {visible.map(entry => (
                    <div
                        className={entry.online ? styles.avatarOnline : styles.avatar}
                        key={entry.id}
                        style={{borderColor: presenceColor(entry.id)}}
                        title={`${entry.username}${entry.self ? ' (you)' : ''} — ${entry.role || 'collaborator'}${
                            entry.online ? ', online' : ', offline'}`}
                    >
                        {entry.username.slice(0, 1).toUpperCase()}
                    </div>
                ))}
                {overflow > 0 ? (
                    <div
                        className={styles.avatar}
                        title={`${overflow} more collaborator(s)`}
                    >
                        {`+${overflow}`}
                    </div>
                ) : null}
            </div>
        );
    }
}

PresenceAvatars.propTypes = {
    vm: PropTypes.object.isRequired
};

export default PresenceAvatars;
