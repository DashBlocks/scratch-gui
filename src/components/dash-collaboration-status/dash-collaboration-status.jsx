import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import * as styles from './dash-collaboration-status.css';

const getStatus = vm => {
    const session = vm.dashCollaboration;
    if (!session) return null;
    return {
        state: session.state,
        role: session.client && session.client.role,
        error: session.error,
        members: session.members
    };
};

class DashCollaborationStatus extends React.Component {
    constructor (props) {
        super(props);
        this.state = {status: getStatus(props.vm)};
        this.handleStatus = this.handleStatus.bind(this);
        this.handleReconnect = this.handleReconnect.bind(this);
    }
    componentDidMount () {
        this.props.vm.addListener('DASH_COLLABORATION_STATUS', this.handleStatus);
    }
    componentWillUnmount () {
        this.props.vm.removeListener('DASH_COLLABORATION_STATUS', this.handleStatus);
    }
    handleStatus () {
        this.setState({status: getStatus(this.props.vm)});
    }
    handleReconnect () {
        const session = this.props.vm.dashCollaboration;
        if (!session) return;
        // eslint-disable-next-line no-alert
        const shouldDiscard = !session.hasUnsavedChanges() || window.confirm(
            'Unsaved collaboration changes will be discarded. Reconnect and reload the latest project state?'
        );
        if (shouldDiscard) session.reconnect(true);
    }
    render () {
        const {status} = this.state;
        if (!status) return null;
        const members = Array.isArray(status.members) ? status.members : [];
        const memberNames = members.map(member => {
            if (typeof member === 'string') return member;
            return (member && (member.username || member.name || member.userId || member.id)) || 'User';
        });
        return (
            <div
                className={styles.status}
                role="status"
            >
                <span className={status.state === 'error' ? styles.error : null}>
                    {status.state === 'connected' ? (
                        status.role === 'viewer' ? (
                            <FormattedMessage
                                defaultMessage="Connected - view only"
                                description="Status shown when connected to a collaboration room as a viewer"
                                id="dash.collaboration.connectedViewer"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Connected - editor"
                                description="Status shown when connected to a collaboration room as an editor"
                                id="dash.collaboration.connectedEditor"
                            />
                        )
                    ) : null}
                    {status.state === 'connecting' ? (
                        <FormattedMessage
                            defaultMessage="Connecting..."
                            description="Status shown while joining a collaboration room"
                            id="dash.collaboration.connecting"
                        />
                    ) : null}
                    {status.state === 'reconnecting' ? (
                        <FormattedMessage
                            defaultMessage="Reconnecting..."
                            description="Status shown while reconnecting to a collaboration room"
                            id="dash.collaboration.reconnecting"
                        />
                    ) : null}
                    {status.state === 'error' ? (status.error || (
                        <FormattedMessage
                            defaultMessage="Connection error"
                            description="Fallback error shown when collaboration connection fails without a message"
                            id="dash.collaboration.connectionError"
                        />
                    )) : null}
                </span>
                {status.state === 'error' ? (
                    <button
                        className={styles.button}
                        type="button"
                        onClick={this.handleReconnect}
                    >
                        <FormattedMessage
                            defaultMessage="Reconnect"
                            description="Button to reconnect to a collaboration session"
                            id="dash.collaboration.reconnect"
                        />
                    </button>
                ) : null}
                {memberNames.length ? (
                    <span className={styles.members}>{memberNames.join(', ')}</span>
                ) : null}
            </div>
        );
    }
}

DashCollaborationStatus.propTypes = {
    vm: PropTypes.object.isRequired
};

export default DashCollaborationStatus;
