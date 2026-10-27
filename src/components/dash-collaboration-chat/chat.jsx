import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, FormattedTime} from 'react-intl';
import {CHAT_EVENT, MAX_TEXT} from '../../lib/dash-collaboration-social';
import closeIcon from '../close-button/icon--close.svg';
import * as styles from './chat.css';

class CollaborationChat extends React.Component {
    constructor (props) {
        super(props);
        this.state = {open: false, text: '', failed: false, version: 0};
        this.list = React.createRef();
        this.input = React.createRef();
        this.toggle = React.createRef();
        this.atBottom = true;
        this.change = this.change.bind(this);
        this.handleRead = this.handleRead.bind(this);
        this.handleSend = this.handleSend.bind(this);
        this.setOpen = this.setOpen.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
    }
    componentDidMount () {
        this.props.vm.on(CHAT_EVENT, this.change);
        this.props.vm.on('DASH_COLLABORATION_STATUS', this.change);
        document.addEventListener('visibilitychange', this.handleRead);
        window.addEventListener('focus', this.handleRead);
        window.addEventListener('blur', this.handleRead);
        this.change();
    }
    componentDidUpdate () {
        const social = this.social;
        const last = social && social.messages[social.messages.length - 1];
        const id = last && last.id;
        if (this.state.open && this.atBottom && this.list.current && id !== this.lastMessage) {
            this.list.current.scrollTop = this.list.current.scrollHeight;
        }
        this.lastMessage = id;
        this.handleRead();
    }
    componentWillUnmount () {
        this.props.vm.removeListener(CHAT_EVENT, this.change);
        this.props.vm.removeListener('DASH_COLLABORATION_STATUS', this.change);
        document.removeEventListener('visibilitychange', this.handleRead);
        window.removeEventListener('focus', this.handleRead);
        window.removeEventListener('blur', this.handleRead);
        if (this.social) this.social.setReading(false);
    }
    change () {
        const session = this.props.vm.dashCollaboration;
        const social = session && session.social;
        if (social !== this.social) {
            if (this.social) this.social.setReading(false);
            this.social = social;
            this.setState({open: false, text: '', failed: false});
        }
        this.setState(state => ({version: state.version + 1}));
    }
    handleRead () {
        const list = this.list.current;
        this.atBottom = !list || list.scrollHeight - list.scrollTop - list.clientHeight < 24;
        if (this.social) {
            this.social.setReading(this.state.open && this.atBottom && !document.hidden && document.hasFocus());
        }
    }
    setOpen (open) {
        this.atBottom = true;
        this.lastMessage = null;
        this.setState({open}, () => {
            const element = open ? this.input.current : this.toggle.current;
            if (element) element.focus();
        });
    }
    handleSend (event) {
        event.preventDefault();
        if (!this.social || !this.social.sendMessage(this.state.text)) {
            this.setState({failed: true});
            return;
        }
        this.atBottom = true;
        if (this.list.current) this.list.current.scrollTop = this.list.current.scrollHeight;
        this.setState({text: '', failed: false});
        if (this.input.current) this.input.current.focus();
    }
    handleToggle () {
        this.setOpen(!this.state.open);
    }
    handleClose () {
        this.setOpen(false);
    }
    handleKeyDown (event) {
        event.stopPropagation();
        if (event.key === 'Escape') this.setOpen(false);
    }
    handleChange (event) {
        this.setState({text: event.target.value, failed: false});
    }
    handleInputKeyDown (event) {
        if (event.key === 'Enter' && !event.shiftKey &&
            !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            if (this.state.text.trim()) this.handleSend(event);
        }
    }
    render () {
        const social = this.social;
        if (!social) return null;
        const connected = social.client && social.client.state === 'connected' &&
            social.client.features.includes('chat');
        return (
            <div className={styles.wrapper}>
                <button
                    aria-expanded={this.state.open}
                    className={styles.toggle}
                    ref={this.toggle}
                    type="button"
                    onClick={this.handleToggle}
                >
                    <FormattedMessage
                        defaultMessage="Chat"
                        description="Open the collaboration chat"
                        id="dash.collaboration.chat.title"
                    />
                    {social.unread > 0 ? <span className={styles.badge}>{social.unread}</span> : null}
                </button>
                {this.state.open ? (
                    <section
                        className={styles.panel}
                        onKeyDown={this.handleKeyDown}
                    >
                        <div className={styles.header}>
                            <FormattedMessage
                                defaultMessage="Project chat"
                                description="Collaboration chat heading"
                                id="dash.collaboration.chat.heading"
                            />
                            <button
                                className={styles.close}
                                type="button"
                                onClick={this.handleClose}
                            >
                                <img
                                    alt=""
                                    height="12"
                                    src={closeIcon}
                                    width="12"
                                />
                                <span className={styles.srOnly}>
                                    <FormattedMessage
                                        defaultMessage="Close"
                                        description="Close collaboration chat"
                                        id="dash.collaboration.chat.close"
                                    />
                                </span>
                            </button>
                        </div>
                        <div
                            aria-live="polite"
                            className={styles.messages}
                            ref={this.list}
                            role="log"
                            tabIndex="0"
                            onScroll={this.handleRead}
                        >
                            {social.messages.length ? social.messages.map(message => (
                                <div
                                    className={styles.message}
                                    key={message.id}
                                >
                                    <div className={styles.meta}>
                                        <b className={styles.username}>{message.username}</b>
                                        <time dateTime={new Date(message.ts).toISOString()}>
                                            <FormattedTime value={message.ts} />
                                        </time>
                                    </div>
                                    <div className={styles.text}>{message.text}</div>
                                </div>
                            )) : (
                                <p className={styles.empty}>
                                    <FormattedMessage
                                        defaultMessage="No messages yet."
                                        description="Empty collaboration chat"
                                        id="dash.collaboration.chat.empty"
                                    />
                                </p>
                            )}
                        </div>
                        <form
                            className={styles.form}
                            onSubmit={this.handleSend}
                        >
                            <label className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Message"
                                    description="Collaboration chat input label"
                                    id="dash.collaboration.chat.message"
                                />
                                <textarea
                                    className={styles.input}
                                    disabled={!connected}
                                    maxLength={MAX_TEXT}
                                    ref={this.input}
                                    rows="2"
                                    value={this.state.text}
                                    onChange={this.handleChange}
                                    onKeyDown={this.handleInputKeyDown}
                                />
                            </label>
                            {!connected || this.state.failed ? (
                                <p
                                    className={styles.notice}
                                    role="status"
                                >
                                    <FormattedMessage
                                        defaultMessage="Chat unavailable. Your draft is kept. Try again when connected."
                                        description="Chat unavailable or send failed"
                                        id="dash.collaboration.chat.unavailable"
                                    />
                                </p>
                            ) : null}
                            <div className={styles.footer}>
                                <span>{this.state.text.length}{'/'}{MAX_TEXT}</span>
                                <button
                                    className={styles.send}
                                    disabled={!connected || !this.state.text.trim()}
                                    type="submit"
                                >
                                    <FormattedMessage
                                        defaultMessage="Send"
                                        description="Send a collaboration chat message"
                                        id="dash.collaboration.chat.send"
                                    />
                                </button>
                            </div>
                        </form>
                    </section>
                ) : null}
            </div>
        );
    }
}

CollaborationChat.propTypes = {vm: PropTypes.object.isRequired};

export default CollaborationChat;
