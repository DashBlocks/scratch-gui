import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/modal.jsx';
import {requestDashApi} from '../../lib/dash-api';
import {encodeGradHTML, pointerPercent, profileBackground, sortedParts} from '../../lib/gradient-maker';
import FramedAvatar from '../dash-framed-avatar/framed-avatar.jsx';
import * as styles from './appearance.css';

const messages = defineMessages({
    title: {
        id: 'dash.appearance.title',
        defaultMessage: 'Appearance',
        description: 'Profile appearance'
    },
    point: {
        id: 'dash.appearance.point',
        defaultMessage: 'Color stop {number}',
        description: 'Color stop selector'
    }
});

const initialParts = gradient => (gradient ? gradient.stops.map(stop => ({
    c: stop.color.length === 4 ? `#${stop.color.slice(1).split('')
        .map(char => char + char)
        .join('')}` : stop.color,
    p: parseFloat(stop.position)
})) : [{c: '#855cd6', p: 0}, {c: '#ffab19', p: 100}]);

const makeGradient = ({custom, dir, parts}) => (custom ? {
    type: 'linear',
    angle: dir,
    stops: sortedParts(parts).map(({c, p}) => ({color: c, position: `${p}%`}))
} : null);

const frameName = frame => {
    switch (frame) {
    case frame.id === 'blocks':
        return (<FormattedMessage
            id="dash.appearance.blocks"
            defaultMessage="Blocks"
            description="Avatar frame"
        />);
    case frame.id === 'dashy':
        return (<FormattedMessage
            id="dash.appearance.dashy"
            defaultMessage="Dashy"
            description="Avatar frame"
        />);
    case frame.id === 'thorny-core':
        return (
            <FormattedMessage
                id="dash.appearance.thorny"
                defaultMessage="Thorny Core"
                description="Avatar frame"
            />
        );
    case frame.id === 'costume-editor':
        return (
            <>
                <FormattedMessage
                    id="dash.appearance.costumeEditor"
                    defaultMessage="Costume Editor"
                    description="Avatar frame"
                />
                {' ('}
                <FormattedMessage
                    defaultMessage="by {author}"
                    description="Displayed under project title to credit creator"
                    id="tw.studioview.authorAttribution"
                    values={{
                        author: <a
                            href={`user#${frame.author.id}`}
                            target="_blank"
                            rel="noreferrer"
                        >{frame.author.username}</a>
                    }}
                />
                {')'}
            </>
        );
    case frame.id === 'googly-eyes':
        return (
            <>
                <FormattedMessage
                    id="dash.appearance.googlyEyes"
                    defaultMessage="Googly Eyes"
                    description="Avatar frame"
                />
                {' ('}
                <FormattedMessage
                    defaultMessage="by {author}"
                    description="Displayed under project title to credit creator"
                    id="tw.studioview.authorAttribution"
                    values={{
                        author: <a
                            href={`user#${frame.author.id}`}
                            target="_blank"
                            rel="noreferrer"
                        >{frame.author.username}</a>
                    }}
                />
                {')'}
            </>
        );
    case frame.id === 'card':
        return (
            <>
                <FormattedMessage
                    id="dash.appearance.card"
                    defaultMessage="Card"
                    description="Avatar frame"
                />
                {' ('}
                <FormattedMessage
                    defaultMessage="by {author}"
                    description="Displayed under project title to credit creator"
                    id="tw.studioview.authorAttribution"
                    values={{
                        author: <a
                            href={`user#${frame.author.id}`}
                            target="_blank"
                            rel="noreferrer"
                        >{frame.author.username}</a>
                    }}
                />
                {')'}
            </>
        );
    default:
        return frame.name || frame.id.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }
};

class Appearance extends React.Component {
    constructor (props) {
        super(props);
        const {gradient, avatarFrame} = props.user.profile;
        this.state = {
            custom: Boolean(gradient),
            dir: gradient ? gradient.angle : 90,
            parts: initialParts(gradient),
            selected: 0,
            frame: avatarFrame || null,
            frames: [],
            listStatus: 'loading',
            error: null,
            saving: false
        };
        this.savedGradient = JSON.stringify(makeGradient(this.state));
        this.savedFrame = avatarFrame || null;
        this.rail = React.createRef();
        bindAll(this, [
            'handleLoadFrames',
            'handleToggleCustom',
            'handleSelectFrame',
            'handleSelectPoint',
            'handleDragStart',
            'handleDragMove',
            'handleSetColor',
            'handleSetPosition',
            'handleSetAngle',
            'handleAddPoint',
            'handleRemovePoint',
            'handleClose',
            'handleSave'
        ]);
    }
    componentDidMount () {
        this.mounted = true;
        this.handleLoadFrames();
    }
    componentWillUnmount () {
        this.mounted = false;
        this.catalog.abort();
    }
    async handleLoadFrames () {
        if (this.catalog) this.catalog.abort();
        this.catalog = new AbortController();
        this.setState({listStatus: 'loading'});
        try {
            const frames = [];
            let total;
            do {
                // I know there isnt that much frames
                const response = await requestDashApi(`/avatar-frames?limit=40&offset=${frames.length}`, {
                    signal: this.catalog.signal
                });
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (!data.ok || !Array.isArray(data.avatarFrames)) throw new Error();
                frames.push(...data.avatarFrames);
                total = data.total;
                if (!data.avatarFrames.length) break;
            } while (frames.length < total);
            if (this.mounted) this.setState({frames, listStatus: 'ready'});
        } catch (error) {
            if (this.mounted && error.name !== 'AbortError') this.setState({listStatus: 'error'});
        }
    }
    handleToggleCustom (event) {
        this.setState({custom: event.target.checked});
    }
    handleSelectFrame (event) {
        this.setState({frame: event.currentTarget.value || null});
    }
    handleSelectPoint (event) {
        this.setState({selected: Number(event.currentTarget.dataset.index)});
    }
    handleDragStart (event) {
        if (event.button !== 0 || !event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        this.handleSelectPoint(event);
    }
    handleDragMove (event) {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const {left, width} = this.rail.current.getBoundingClientRect();
        if (width) {
            this.editPart(Number(event.currentTarget.dataset.index), {
                p: Math.round(pointerPercent(event.clientX, left, width))
            });
        }
    }
    editPart (index, change) {
        this.setState(previous => ({
            parts: previous.parts.map((part, i) => (i === index ? {...part, ...change} : part))
        }));
    }
    handleSetColor (event) {
        this.editPart(this.state.selected, {c: event.target.value});
    }
    handleSetPosition (event) {
        this.editPart(this.state.selected, {p: Number(event.target.value)});
    }
    handleSetAngle (event) {
        this.setState({dir: Number(event.target.value)});
    }
    handleAddPoint () {
        this.setState(({parts, selected}) => {
            if (parts.length >= 6) return null;
            const positions = [0, ...sortedParts(parts).map(part => part.p), 100];
            let gap = 0;
            for (let i = 1; i < positions.length - 1; i++) {
                if (positions[i + 1] - positions[i] > positions[gap + 1] - positions[gap]) gap = i;
            }
            const p = Math.round((positions[gap] + positions[gap + 1]) / 2);
            return {parts: [...parts, {c: parts[selected].c, p}], selected: parts.length};
        });
    }
    handleRemovePoint () {
        this.setState(({parts, selected}) => (parts.length > 2 ? {
            parts: parts.filter((part, index) => index !== selected),
            selected: Math.max(0, selected - 1)
        } : null));
    }
    handleClose () {
        if (!this.inFlight) this.props.onClose();
    }
    async handleSave () {
        if (!this.props.canSave || this.inFlight) return;
        this.inFlight = true;
        this.setState({saving: true, error: null});
        const gradient = makeGradient(this.state);
        const frame = this.state.frame;
        const changes = [];
        if (JSON.stringify(gradient) !== this.savedGradient) changes.push(['set-gradient', {gradient}]);
        if (frame !== this.savedFrame) changes.push(['set-avatar-frame', {avatarFrame: frame}]);
        let applied = 0;
        try {
            for (const [endpoint, body] of changes) {
                const response = await requestDashApi(`/users/${endpoint}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (!response.ok || !data.ok || String(data.user?.id) !== String(this.props.user.id)) throw new Error();
                if (!this.mounted) return;
                if (endpoint === 'set-gradient') this.savedGradient = JSON.stringify(gradient);
                else this.savedFrame = frame;
                this.props.onSaved(data.user);
                applied++;
            }
            if (this.mounted) this.props.onClose();
        } catch {
            if (this.mounted) this.setState({error: applied ? 'partial' : 'failed'});
        } finally {
            this.inFlight = false;
            if (this.mounted) this.setState({saving: false});
        }
    }
    render () {
        const {avatarBackground, avatarSrc, intl, user} = this.props;
        const {custom, dir, error, frame, frames, listStatus, parts, saving, selected} = this.state;
        const dirty = this.savedFrame !== frame || this.savedGradient !== JSON.stringify(makeGradient(this.state));
        const background = custom ? profileBackground(makeGradient(this.state)) : avatarBackground;
        const options = [{id: ''}, ...frames];
        if (this.savedFrame && !options.some(option => option.id === this.savedFrame)) {
            options.push({id: this.savedFrame});
        }
        return (
            <Modal
                id="dashAppearance"
                className={styles.modal}
                contentLabel={intl.formatMessage(messages.title)}
                onRequestClose={this.handleClose}
            >
                <div className={styles.body}>
                    <div
                        className={styles.preview}
                        style={{backgroundImage: background}}
                    >
                        <FramedAvatar
                            avatarClassName={styles.avatar}
                            avatarSrc={avatarSrc}
                            className={styles.largeAvatar}
                            frameId={frame}
                        />
                        <strong>{user.username}</strong>
                    </div>
                    <fieldset disabled={saving}>
                        <legend>
                            <FormattedMessage
                                id="dash.appearance.gradient"
                                defaultMessage="Profile gradient"
                                description="Profile background section"
                            />
                        </legend>
                        <label className={styles.toggle}>
                            <input
                                checked={custom}
                                type="checkbox"
                                onChange={this.handleToggleCustom}
                            />
                            <FormattedMessage
                                id="dash.appearance.custom"
                                defaultMessage="Use a custom gradient"
                                description="Use custom colors instead of the avatar colors"
                            />
                        </label>
                        {custom && (
                            <div className={styles.editor}>
                                <div
                                    ref={this.rail}
                                    className={styles.rail}
                                    style={{backgroundImage: encodeGradHTML({type: 'Linear', dir: 90, parts})}}
                                >
                                    {parts.map((part, index) => (
                                        <button
                                            key={index}
                                            aria-label={intl.formatMessage(messages.point, {number: index + 1})}
                                            aria-pressed={selected === index}
                                            className={styles.handle}
                                            data-index={index}
                                            style={{left: `${part.p}%`, backgroundColor: part.c}}
                                            type="button"
                                            onClick={this.handleSelectPoint}
                                            onPointerDown={this.handleDragStart}
                                            onPointerMove={this.handleDragMove}
                                        />
                                    ))}
                                </div>
                                <div className={styles.row}>
                                    <label>
                                        <FormattedMessage
                                            id="dash.appearance.color"
                                            defaultMessage="Color"
                                            description="Selected stop color"
                                        />
                                        <input
                                            type="color"
                                            value={parts[selected].c}
                                            onChange={this.handleSetColor}
                                        />
                                    </label>
                                    <label>
                                        <FormattedMessage
                                            id="dash.appearance.position"
                                            defaultMessage="Position: {position}%"
                                            description="Selected stop position"
                                            values={{position: parts[selected].p}}
                                        />
                                        <input
                                            max={100}
                                            min={0}
                                            type="range"
                                            value={parts[selected].p}
                                            onChange={this.handleSetPosition}
                                        />
                                    </label>
                                    <label>
                                        <FormattedMessage
                                            id="dash.appearance.angle"
                                            defaultMessage="Angle: {angle}°"
                                            description="Linear gradient direction"
                                            values={{angle: dir}}
                                        />
                                        <input
                                            max={360}
                                            min={0}
                                            type="range"
                                            value={dir}
                                            onChange={this.handleSetAngle}
                                        />
                                    </label>
                                </div>
                                <div className={styles.row}>
                                    <button
                                        disabled={parts.length >= 6}
                                        type="button"
                                        onClick={this.handleAddPoint}
                                    >
                                        <FormattedMessage
                                            id="dash.appearance.add"
                                            defaultMessage="Add color stop"
                                            description="Add gradient stop"
                                        />
                                    </button>
                                    <button
                                        disabled={parts.length <= 2}
                                        type="button"
                                        onClick={this.handleRemovePoint}
                                    >
                                        <FormattedMessage
                                            id="dash.appearance.remove"
                                            defaultMessage="Remove color stop"
                                            description="Remove selected gradient stop"
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </fieldset>
                    <fieldset disabled={saving}>
                        <legend>
                            <FormattedMessage
                                id="dash.appearance.frames"
                                defaultMessage="Avatar frame"
                                description="Avatar frames section"
                            />
                        </legend>
                        {listStatus === 'loading' && (
                            <p role="status">
                                <FormattedMessage
                                    id="dash.appearance.loading"
                                    defaultMessage="Loading frames…"
                                    description="Frame catalog is loading"
                                />
                            </p>
                        )}
                        {listStatus === 'error' && (
                            <button
                                type="button"
                                onClick={this.handleLoadFrames}
                            >
                                <FormattedMessage
                                    id="dash.appearance.retry"
                                    defaultMessage="Could not load frames. Try again"
                                    description="Retry frame catalog"
                                />
                            </button>
                        )}
                        <div className={styles.frames}>
                            {options.map(option => (
                                <label
                                    key={option.id}
                                    className={styles.frameCard}
                                >
                                    <input
                                        checked={option.id === (frame || '')}
                                        name="appearance-frame"
                                        type="radio"
                                        value={option.id}
                                        onChange={this.handleSelectFrame}
                                    />
                                    <span className={styles.tile}>
                                        <FramedAvatar
                                            avatarClassName={styles.avatar}
                                            avatarSrc={avatarSrc}
                                            className={styles.smallAvatar}
                                            frameId={option.id || null}
                                        />
                                        {option.id ? frameName(option) : (
                                            <FormattedMessage
                                                id="dash.appearance.none"
                                                defaultMessage="No frame"
                                                description="Avatar without a frame"
                                            />
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    {error && (
                        <p role="alert">
                            {error === 'partial' ? (
                                <FormattedMessage
                                    id="dash.appearance.partial"
                                    defaultMessage="Gradient saved. The frame could not be saved. Try again."
                                    description="Only the first change succeeded"
                                />
                            ) : (
                                <FormattedMessage
                                    id="dash.appearance.failed"
                                    defaultMessage="Could not save your appearance. Try again."
                                    description="Saving failed"
                                />
                            )}
                        </p>
                    )}
                    <div className={styles.actions}>
                        <button
                            disabled={saving}
                            type="button"
                            onClick={this.handleClose}
                        >
                            <FormattedMessage
                                id="dash.appearance.cancel"
                                defaultMessage="Cancel"
                                description="Close appearance settings"
                            />
                        </button>
                        {this.props.canSave ? (
                            <button
                                disabled={saving || !dirty}
                                type="button"
                                onClick={this.handleSave}
                            >
                                <FormattedMessage
                                    id="dash.appearance.save"
                                    defaultMessage="Save"
                                    description="Save profile appearance"
                                />
                            </button>
                        ) : (
                            <a
                                className={styles.supportButton}
                                href="./support"
                            >
                                <FormattedMessage
                                    id="dash.appearance.support"
                                    defaultMessage="Support to level up your look"
                                    description="Open the support page from appearance settings"
                                />
                            </a>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }
}

Appearance.propTypes = {
    avatarBackground: PropTypes.string,
    avatarSrc: PropTypes.string.isRequired,
    canSave: PropTypes.bool.isRequired,
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired
};

export default injectIntl(Appearance);
