import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';

import AddonHooks from '../../addons/hooks';
import {listenDashChat, MAX_TEXT} from '../../lib/dash-chat.js';
import {presenceColor} from '../../lib/dash-presence.js';
import {activateTab, COSTUMES_TAB_INDEX} from '../../reducers/editor-tab';
import VM from 'scratch-vm';
import * as styles from './dash-chat.css';

const EMOJI_CATEGORIES = [
    {
        id: 'smileys',
        icon: '\u{1F600}',
        emojis: ['\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F923}', '\u{1F603}', '\u{1F604}', '\u{1F605}',
            '\u{1F606}', '\u{1F609}', '\u{1F60A}', '\u{1F60B}', '\u{1F60D}', '\u{1F970}', '\u{1F618}', '\u{1F617}',
            '\u{1F619}', '\u{1F61A}', '\u{1F914}', '\u{1F928}', '\u{1F610}', '\u{1F611}', '\u{1F634}', '\u{1F637}',
            '\u{1F60E}', '\u{1F913}', '\u{1F929}', '\u{1F973}', '\u{1F97A}', '\u{1F62D}', '\u{1F622}', '\u{1F621}',
            '\u{1F92C}', '\u{1F92F}', '\u{1F631}', '\u{1F633}', '\u{1F92A}', '\u{1F92B}', '\u{1F917}', '\u{1F60F}']
    },
    {
        id: 'gestures',
        icon: '\u{1F44D}',
        emojis: ['\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F44C}', '\u{270C}\u{FE0F}', '\u{1F91E}',
            '\u{1F91F}', '\u{1F44B}', '\u{1F91A}', '\u{270B}', '\u{1F590}\u{FE0F}', '\u{1F448}', '\u{1F449}',
            '\u{1F446}', '\u{1F447}', '\u{1F44A}', '\u{1F91B}', '\u{1F91C}', '\u{1F450}', '\u{1F64F}', '\u{1F91D}',
            '\u{1F9E1}', '\u{1F4AA}', '\u{1F9B6}', '\u{1F485}', '\u{1F933}', '\u{1F930}', '\u{1F60C}', '\u{1F971}']
    },
    {
        id: 'hearts',
        icon: '\u{2764}\u{FE0F}',
        emojis: ['\u{2764}\u{FE0F}', '\u{1F9E1}', '\u{1F49B}', '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F90E}',
            '\u{1F5A4}', '\u{1F90D}', '\u{1F494}', '\u{2763}\u{FE0F}', '\u{1F495}', '\u{1F496}', '\u{1F497}',
            '\u{1F498}', '\u{1F49D}', '\u{1F49E}', '\u{1F493}', '\u{2764}\u{FE0F}\u{200D}\u{1F525}', '\u{1F4AF}']
    },
    {
        id: 'nature',
        icon: '\u{1F431}',
        emojis: ['\u{1F431}', '\u{1F436}', '\u{1F43A}', '\u{1F98A}', '\u{1F43B}', '\u{1F428}', '\u{1F42F}',
            '\u{1F42E}', '\u{1F437}', '\u{1F438}', '\u{1F435}', '\u{1F414}', '\u{1F427}', '\u{1F426}', '\u{1F424}',
            '\u{1F989}', '\u{1F987}', '\u{1F43C}', '\u{1F43D}', '\u{1F430}', '\u{1F439}', '\u{1F433}', '\u{1F40B}',
            '\u{1F42C}', '\u{1F41F}', '\u{1F420}', '\u{1F421}', '\u{1F33B}', '\u{1F337}', '\u{1F341}', '\u{1F340}']
    },
    {
        id: 'objects',
        icon: '\u{2B50}',
        emojis: ['\u{2B50}', '\u{1F31F}', '\u{2728}', '\u{1F4AB}', '\u{1F525}', '\u{1F389}', '\u{1F388}',
            '\u{1F381}', '\u{1F3A8}', '\u{1F3AC}', '\u{1F3B5}', '\u{1F3B8}', '\u{1F3B2}', '\u{1F3AE}', '\u{1F579}',
            '\u{1F4BB}', '\u{1F4FA}', '\u{1F47E}', '\u{1F916}', '\u{1F680}', '\u{1F6F8}', '\u{2600}\u{FE0F}',
            '\u{1F308}', '\u{1F32A}\u{FE0F}', '\u{26C8}\u{FE0F}', '\u{26A1}', '\u{1F4A1}', '\u{1F4BF}', '\u{1F3B9}',
            '\u{1F3AF}']
    },
    {
        id: 'food',
        icon: '\u{1F354}',
        emojis: ['\u{1F354}', '\u{1F35F}', '\u{1F355}', '\u{1F363}', '\u{1F361}', '\u{1F373}', '\u{1F35D}',
            '\u{1F368}', '\u{1F366}', '\u{1F367}', '\u{1F382}', '\u{1F370}', '\u{1F9C1}', '\u{1F36A}', '\u{1F36B}',
            '\u{1F36C}', '\u{1F36D}', '\u{1F95E}', '\u{1F9C0}', '\u{1F35E}', '\u{1F950}', '\u{1F955}', '\u{1F34E}',
            '\u{1F34A}', '\u{1F349}', '\u{1F347}', '\u{1F353}', '\u{1F352}', '\u{1F34B}', '\u{1F34C}']
    }
];

const MENTION_PATTERN = /(@[A-Za-z0-9_-]+)/g;

const targetName = target => {
    if (!target) return '';
    if (typeof target.getName === 'function') return target.getName();
    if (target.sprite && target.sprite.name) return target.sprite.name;
    return '';
};

class DashChat extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            open: false,
            version: 0,
            draft: '',
            pinEnabled: false,
            showEmoji: false,
            emojiCategory: EMOJI_CATEGORIES[0].id,
            pinnedOnly: false
        };
        bindAll(this, [
            'handleChatChange',
            'handleToggleOpen',
            'handleClose',
            'handleChangeDraft',
            'handleKeyDown',
            'handleSend',
            'handleToggleEmoji',
            'handleSelectEmoji',
            'handleSelectEmojiCategory',
            'handleTogglePin',
            'handleTogglePinnedOnly',
            'handleClickPin',
            'handleDocumentClick',
            'setListRef',
            'setInputRef'
        ]);
        this.detachChat = null;
        this.pendingPin = null;
    }
    componentDidMount () {
        this.detachChat = listenDashChat(this.props.vm, this.handleChatChange);
        document.addEventListener('mousedown', this.handleDocumentClick, true);
    }
    componentWillUnmount () {
        if (this.detachChat) this.detachChat();
        document.removeEventListener('mousedown', this.handleDocumentClick, true);
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.state.open && (prevState.version !== this.state.version || !prevState.open)) {
            this.scrollToBottom();
        }
    }
    handleDocumentClick (event) {
        if (!this.state.showEmoji || !this.wrapperRef) return;
        if (!this.wrapperRef.contains(event.target)) this.setState({showEmoji: false});
    }
    handleChatChange () {
        this.setState({version: this.state.version + 1});
    }
    handleToggleOpen () {
        const open = !this.state.open;
        this.setState({open, showEmoji: false});
        if (open) this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.chat.markRead();
    }
    handleClose () {
        this.setState({open: false, showEmoji: false});
    }
    handleChangeDraft (event) {
        this.setState({draft: event.target.value.slice(0, MAX_TEXT)});
    }
    handleKeyDown (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSend();
        }
    }
    handleSend () {
        const chat = this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.chat;
        if (!chat) return;
        const pin = this.state.pinEnabled ? this.capturePin() : null;
        if (chat.sendText(this.state.draft, pin)) {
            this.setState({draft: '', pinEnabled: false});
        }
    }
    capturePin () {
        const vm = this.props.vm;
        const target = vm.editingTarget;
        if (!target) return null;
        const targetId = target.id;
        const name = targetName(target);
        const workspace = AddonHooks.blocklyWorkspace;
        const selected = workspace && workspace.selected;
        if (selected && selected.id && this.props.activeTabIndex === 0) {
            return {type: 'block', targetId, blockId: selected.id, name};
        }
        if (this.props.activeTabIndex === COSTUMES_TAB_INDEX) {
            return {type: 'costume', targetId, name};
        }
        return {type: 'sprite', targetId, name};
    }
    handleToggleEmoji () {
        this.setState({showEmoji: !this.state.showEmoji});
    }
    handleSelectEmojiCategory (id) {
        this.setState({emojiCategory: id});
    }
    handleSelectEmoji (emoji) {
        const input = this.inputRef;
        const draft = this.state.draft;
        if (!input) {
            this.setState({draft: (draft + emoji).slice(0, MAX_TEXT)});
            return;
        }
        const start = typeof input.selectionStart === 'number' ? input.selectionStart : draft.length;
        const end = typeof input.selectionEnd === 'number' ? input.selectionEnd : draft.length;
        const next = (draft.slice(0, start) + emoji + draft.slice(end)).slice(0, MAX_TEXT);
        this.setState({draft: next}, () => {
            input.focus();
            const caret = Math.min(start + emoji.length, MAX_TEXT);
            input.setSelectionRange(caret, caret);
        });
    }
    handleTogglePin () {
        this.setState({pinEnabled: !this.state.pinEnabled});
    }
    handleTogglePinnedOnly () {
        this.setState({pinnedOnly: !this.state.pinnedOnly});
    }
    handleClickPin (pin) {
        if (!pin) return;
        const vm = this.props.vm;
        vm.setEditingTarget(pin.targetId);
        if (pin.type === 'costume') this.props.onActivateTab(COSTUMES_TAB_INDEX);
        if (pin.type === 'block' && pin.blockId) {
            const workspace = AddonHooks.blocklyWorkspace;
            const root = workspace && workspace.getInjectionDiv && workspace.getInjectionDiv();
            const element = root && root.querySelector(`[data-id="${pin.blockId}"]`);
            if (element) {
                const restore = element.style.filter;
                element.style.filter =
                    'drop-shadow(0 0 3px rgba(76, 151, 255, 1)) drop-shadow(0 0 3px rgba(76, 151, 255, 1))';
                setTimeout(() => {
                    element.style.filter = restore;
                }, 2500);
            }
        }
    }
    setListRef (ref) {
        this.listRef = ref;
    }
    setInputRef (ref) {
        this.inputRef = ref;
    }
    scrollToBottom () {
        if (this.listRef) this.listRef.scrollTop = this.listRef.scrollHeight;
    }
    renderMentions (text) {
        const self = (this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.chat.selfUsername) || '';
        return String(text).split(MENTION_PATTERN).map((part, index) => {
            if (part.startsWith('@')) {
                const isMe = self && part.toLowerCase() === `@${self.toLowerCase()}`;
                return (
                    <span
                        className={isMe ? styles.mentionMe : styles.mention}
                        key={index}
                    >{part}</span>
                );
            }
            return part;
        });
    }
    renderMessage (message) {
        return (
            <div
                className={message.userId === (this.props.vm.dashCollaboration &&
                    this.props.vm.dashCollaboration.chat.selfUserId) ? styles.messageSelf : styles.message}
                key={message.id}
            >
                <div className={styles.messageMeta}>
                    <span
                        className={styles.messageAuthor}
                        style={{color: presenceColor(message.userId)}}
                    >
                        {message.username}
                    </span>
                    <span className={styles.messageTime}>
                        {new Date(message.ts).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </span>
                </div>
                <div className={styles.messageText}>{this.renderMentions(message.text)}</div>
                {message.pin ? (
                    <button
                        className={styles.pinChip}
                        type="button"
                        onClick={() => this.handleClickPin(message.pin)}
                    >
                        {'\u{1F4CC}'}
                        {message.pin.type === 'block' ? (
                            <FormattedMessage
                                defaultMessage="Block"
                                description="Label of a chat message pinned to a block"
                                id="dash.chat.pinBlock"
                            />
                        ) : message.pin.type === 'costume' ? (
                            <FormattedMessage
                                defaultMessage="Costume"
                                description="Label of a chat message pinned to a costume"
                                id="dash.chat.pinCostume"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Sprite"
                                description="Label of a chat message pinned to a sprite"
                                id="dash.chat.pinSprite"
                            />
                        )}
                        {message.pin.name ? <span className={styles.pinName}>{message.pin.name}</span> : null}
                    </button>
                ) : null}
            </div>
        );
    }
    render () {
        const chat = this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.chat;
        if (!chat) return null;
        const messages = this.state.pinnedOnly ?
            chat.messages.filter(message => message.pin) : chat.messages;
        const category = EMOJI_CATEGORIES.find(entry => entry.id === this.state.emojiCategory) ||
            EMOJI_CATEGORIES[0];
        const pendingPin = this.state.pinEnabled ? this.capturePin() : null;
        return (
            <div
                className={styles.wrapper}
                ref={ref => {
                    this.wrapperRef = ref;
                }}
            >
                <button
                    className={styles.toggle}
                    title={chat.lastMention ?
                        this.props.intl.formatMessage({
                            id: 'dash.chat.mentionTitle',
                            defaultMessage: '{username} mentioned you',
                            description: 'Tooltip shown when the user was mentioned in the chat'
                        }, {username: chat.lastMention.username}) :
                        this.props.intl.formatMessage({
                            id: 'dash.chat.title',
                            defaultMessage: 'Session chat',
                            description: 'Tooltip for the session chat toggle button'
                        })}
                    type="button"
                    onClick={this.handleToggleOpen}
                >
                    {'\u{1F4AC}'}
                    {chat.unread > 0 ? (
                        <span className={styles.badge}>{chat.unread > 9 ? '9+' : chat.unread}</span>
                    ) : null}
                </button>
                {this.state.open ? (
                    <div className={styles.panel}>
                        <div className={styles.header}>
                            <FormattedMessage
                                defaultMessage="Session chat"
                                description="Title of the live-collaboration chat panel"
                                id="dash.chat.header"
                            />
                            <button
                                className={this.state.pinnedOnly ? styles.headerButtonActive : styles.headerButton}
                                title={this.props.intl.formatMessage({
                                    id: 'dash.chat.pinnedOnly',
                                    defaultMessage: 'Show pinned messages only',
                                    description: 'Toggle to filter chat messages by pinned ones'
                                })}
                                type="button"
                                onClick={this.handleTogglePinnedOnly}
                            >
                                {'\u{1F4CC}'}
                            </button>
                            <button
                                className={styles.headerButton}
                                title={this.props.intl.formatMessage({
                                    id: 'dash.chat.close',
                                    defaultMessage: 'Close chat',
                                    description: 'Close the chat panel'
                                })}
                                type="button"
                                onClick={this.handleClose}
                            >
                                {'\u2715'}
                            </button>
                        </div>
                        <div
                            className={styles.list}
                            ref={this.setListRef}
                        >
                            {messages.length ? messages.map(message => this.renderMessage(message)) : (
                                <div className={styles.empty}>
                                    <FormattedMessage
                                        defaultMessage="No messages yet. Say hi!"
                                        description="Placeholder of the empty chat history"
                                        id="dash.chat.empty"
                                    />
                                </div>
                            )}
                        </div>
                        {pendingPin ? (
                            <div className={styles.pendingPin}>
                                {'\u{1F4CC} '}
                                {pendingPin.type === 'block' ? (
                                    <FormattedMessage
                                        defaultMessage="Will pin to block"
                                        description="Label of the pending pin context (a block)"
                                        id="dash.chat.willPinBlock"
                                    />
                                ) : pendingPin.type === 'costume' ? (
                                    <FormattedMessage
                                        defaultMessage="Will pin to costume"
                                        description="Label of the pending pin context (a costume)"
                                        id="dash.chat.willPinCostume"
                                    />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Will pin to sprite"
                                        description="Label of the pending pin context (a sprite)"
                                        id="dash.chat.willPinSprite"
                                    />
                                )}
                                {pendingPin.name ? <span className={styles.pinName}>{pendingPin.name}</span> : null}
                            </div>
                        ) : null}
                        <div className={styles.composer}>
                            <button
                                className={this.state.pinEnabled ? styles.composerButtonActive : styles.composerButton}
                                title={this.props.intl.formatMessage({
                                    id: 'dash.chat.pin',
                                    defaultMessage: 'Pin this message to the current sprite, costume or block',
                                    description: 'Toggle pinning of the next chat message'
                                })}
                                type="button"
                                onClick={this.handleTogglePin}
                            >
                                {'\u{1F4CC}'}
                            </button>
                            <button
                                className={this.state.showEmoji ? styles.composerButtonActive : styles.composerButton}
                                title={this.props.intl.formatMessage({
                                    id: 'dash.chat.emoji',
                                    defaultMessage: 'Emoji',
                                    description: 'Open the emoji picker'
                                })}
                                type="button"
                                onClick={this.handleToggleEmoji}
                            >
                                {'\u{1F600}'}
                            </button>
                            <textarea
                                className={styles.input}
                                placeholder={this.props.intl.formatMessage({
                                    id: 'dash.chat.placeholder',
                                    defaultMessage: 'Message... (@username to mention)',
                                    description: 'Placeholder of the chat message input'
                                })}
                                rows={1}
                                value={this.state.draft}
                                onChange={this.handleChangeDraft}
                                onKeyDown={this.handleKeyDown}
                                ref={this.setInputRef}
                            />
                            <button
                                className={styles.sendButton}
                                disabled={!this.state.draft.trim().length}
                                title={this.props.intl.formatMessage({
                                    id: 'dash.chat.send',
                                    defaultMessage: 'Send',
                                    description: 'Send the chat message'
                                })}
                                type="button"
                                onClick={this.handleSend}
                            >
                                {'\u{27A4}'}
                            </button>
                        </div>
                        {this.state.showEmoji ? (
                            <div className={styles.emojiPicker}>
                                <div className={styles.emojiCategories}>
                                    {EMOJI_CATEGORIES.map(entry => (
                                        <button
                                            className={entry.id === category.id ?
                                                styles.emojiCategoryActive : styles.emojiCategory}
                                            key={entry.id}
                                            type="button"
                                            onClick={() => this.handleSelectEmojiCategory(entry.id)}
                                        >
                                            {entry.icon}
                                        </button>
                                    ))}
                                </div>
                                <div className={styles.emojiGrid}>
                                    {category.emojis.map((emoji, index) => (
                                        <button
                                            className={styles.emojiCell}
                                            key={`${emoji}-${index}`}
                                            type="button"
                                            onClick={() => this.handleSelectEmoji(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    }
}

DashChat.propTypes = {
    activeTabIndex: PropTypes.number.isRequired,
    intl: intlShape,
    onActivateTab: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    activeTabIndex: state.scratchGui.editorTab.activeTabIndex
});

const mapDispatchToProps = dispatch => ({
    onActivateTab: index => dispatch(activateTab(index))
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(DashChat));
