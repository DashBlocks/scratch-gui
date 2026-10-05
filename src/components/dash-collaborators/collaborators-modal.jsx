import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import Modal from '../../containers/modal.jsx';
import FramedAvatar from '../dash-framed-avatar/framed-avatar.jsx';
import {requestDashApi} from '../../lib/dash-api.js';
import styles from './collaborators-modal.css';

const messages = defineMessages({
    title: {
        id: 'dash.collaboration.title',
        defaultMessage: 'Collaborators',
        description: 'Title of the project collaborator management dialog'
    },
    editor: {
        id: 'dash.collaboration.editor',
        defaultMessage: 'Editor',
        description: 'A collaborator who can edit the project'
    },
    viewer: {
        id: 'dash.collaboration.viewer',
        defaultMessage: 'Viewer',
        description: 'A collaborator who can view the collaborative project'
    },
    shareBeforeManaging: {
        id: 'dash.collaboration.shareBeforeManaging',
        defaultMessage: 'Share your project before managing live-collaboration',
        description: 'Message indicating that the project must be shared before managing collaborators'
    }
});

class CollaboratorsModal extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            username: '',
            role: 'editor',
            collaborators: [],
            loading: true,
            busy: false,
            error: ''
        };
        this.mounted = false;
        this.pending = false;
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleRoleChange = this.handleRoleChange.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
    }
    componentDidMount () {
        this.mounted = true;
        this.runRequest();
    }
    componentWillUnmount () {
        this.mounted = false;
    }
    async runRequest (path = '', options = {}, clearUsername = false) {
        if (this.pending) return;
        this.pending = true;
        this.setState({busy: true, error: ''});
        try {
            const projectId = String(this.props.projectId);
            if (!/^[1-9]\d{0,19}$/.test(projectId)) {
                throw new Error(this.props.intl.formatMessage(messages.shareBeforeManaging));
            }
            const response = await requestDashApi(
                `/projects/${encodeURIComponent(projectId)}/collaborators${path}`,
                {...options, credentials: 'include'}
            );
            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.error);
            }
            if (this.mounted) {
                this.setState({collaborators: data.collaborators, ...(clearUsername ? {username: ''} : {})});
            }
        } catch (error) {
            if (this.mounted) this.setState({error: error.message});
        } finally {
            this.pending = false;
            if (this.mounted) this.setState({busy: false, loading: false});
        }
    }
    handleUsernameChange (event) {
        this.setState({username: event.target.value});
    }
    handleRoleChange (event) {
        this.setState({role: event.target.value});
    }
    handleAdd (event) {
        event.preventDefault();
        const username = this.state.username.trim();
        if (!username) return;
        this.runRequest('', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, role: this.state.role})
        }, true);
    }
    handleRemove (event) {
        const userId = event.currentTarget.dataset.userId;
        this.runRequest(`/${encodeURIComponent(userId)}`, {
            method: 'DELETE'
        });
    }
    render () {
        const {intl, onClose, isRtl} = this.props;
        const {username, role, collaborators, loading, busy, error} = this.state;
        return (
            <Modal
                id="dashCollaborators"
                className={styles.modal}
                contentLabel={intl.formatMessage(messages.title)}
                isRtl={isRtl}
                onRequestClose={onClose}
            >
                <div className={styles.body}>
                    <p>
                        <FormattedMessage
                            id="dash.collaboration.explanation"
                            defaultMessage="Add a Dash user. Add the same username again to update their role."
                            description="How the project owner manages collaborators"
                        />
                    </p>
                    <form
                        className={styles.form}
                        onSubmit={this.handleAdd}
                    >
                        <label htmlFor="dash-collaborator-username">
                            <FormattedMessage
                                id="dash.collaboration.username"
                                defaultMessage="Username"
                                description="Label for the collaborator username field"
                            />
                        </label>
                        <input
                            id="dash-collaborator-username"
                            autoComplete="off"
                            maxLength={20}
                            disabled={busy}
                            value={username}
                            onChange={this.handleUsernameChange}
                        />
                        <label htmlFor="dash-collaborator-role">
                            <FormattedMessage
                                id="dash.collaboration.role"
                                defaultMessage="Role"
                                description="Label for the collaborator permission field"
                            />
                        </label>
                        <select
                            id="dash-collaborator-role"
                            disabled={busy}
                            value={role}
                            onChange={this.handleRoleChange}
                        >
                            <option value="editor">{intl.formatMessage(messages.editor)}</option>
                            <option value="viewer">{intl.formatMessage(messages.viewer)}</option>
                        </select>
                        <button
                            className={styles.button}
                            type="submit"
                            disabled={busy || !username.trim()}
                        >
                            <FormattedMessage
                                id="dash.collaboration.add"
                                defaultMessage="Add / Update"
                                description="Button to add a collaborator or update their role"
                            />
                        </button>
                    </form>
                    {error && <p role="alert">{error}</p>}
                    <div aria-live="polite">
                        {loading ? (
                            <FormattedMessage
                                id="dash.collaboration.loading"
                                defaultMessage="Loading collaborators..."
                                description="Loading state for collaborator management"
                            />
                        ) : collaborators.length === 0 ? (
                            <FormattedMessage
                                id="dash.collaboration.empty"
                                defaultMessage="No collaborators found"
                                description="Empty collaborator list"
                            />
                        ) : (
                            <ul className={styles.list}>
                                {collaborators.map(member => (
                                    <li
                                        className={styles.member}
                                        key={member.id}
                                    >
                                        <FramedAvatar
                                            avatarSrc={`https://api.dashblocks.org/users/avatars/${member.profile.avatarId}`}
                                            avatarClassName={styles.thumbnail}
                                            className={styles.avatar}
                                            frameId={member.profile.avatarFrame}
                                        />
                                        <a
                                            href={`user#${member.id}`}
                                            className={styles.name}
                                        >
                                            {member.username}
                                        </a>
                                        <span>{intl.formatMessage(messages[member.collaborationRole])}</span>
                                        <button
                                            className={styles.button}
                                            type="button"
                                            disabled={busy}
                                            data-user-id={member.id}
                                            onClick={this.handleRemove}
                                        >
                                            <FormattedMessage
                                                id="dash.collaboration.remove"
                                                defaultMessage="Remove"
                                                description="Button to remove a collaborator"
                                            />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }
}

CollaboratorsModal.propTypes = {
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    projectId: PropTypes.string.isRequired
};

export default injectIntl(CollaboratorsModal);
