import PropTypes from 'prop-types';
import React from 'react';

import {listenPresence} from '../../lib/dash-presence.js';
import * as styles from './presence-cursors.css';

/**
 * Overlay layer that renders remote collaboration cursors (Figma-style).
 * Place it inside a positioned container matching the surface being tracked.
 * Cursor coordinates are surface-local: `x`/`y` in 0..1 for the stage, or
 * workspace units for the blocks area (when a `transform` prop is provided).
 */
class PresenceCursors extends React.Component {
    constructor (props) {
        super(props);
        this.state = {version: 0};
        this.handlePresenceChange = this.handlePresenceChange.bind(this);
        this.detachPresence = null;
        this.highlighted = new Map();
    }
    componentDidMount () {
        this.detachPresence = listenPresence(this.props.vm, this.handlePresenceChange);
    }
    componentWillUnmount () {
        if (this.detachPresence) this.detachPresence();
        this.clearHighlights();
    }
    componentDidUpdate () {
        this.updateHighlights();
    }
    handlePresenceChange () {
        this.setState({version: this.state.version + 1});
    }
    getPresence () {
        return (this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.presence) || null;
    }
    clearHighlights () {
        for (const [element, restore] of this.highlighted) {
            element.style.filter = restore;
        }
        this.highlighted.clear();
    }
    /**
     * Outline blocks that remote participants are currently dragging.
     */
    updateHighlights () {
        if (!this.props.highlightDragged) return;
        const presence = this.getPresence();
        const root = this.props.highlightRoot;
        const wanted = new Map();
        if (presence && root) {
            for (const peer of presence.getPeers()) {
                if (peer.state.dragging) wanted.set(peer.state.dragging, peer.color);
            }
        }
        for (const [element, restore] of [...this.highlighted]) {
            if (!wanted.has(element.getAttribute('data-id'))) {
                element.style.filter = restore;
                this.highlighted.delete(element);
            }
        }
        for (const [blockId, color] of wanted) {
            const element = root.querySelector(`[data-id="${blockId}"]`);
            if (!element || this.highlighted.has(element)) continue;
            this.highlighted.set(element, element.style.filter);
            element.style.filter = `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 3px ${color})`;
        }
    }
    render () {
        const presence = this.getPresence();
        if (!presence) return null;
        const {surface, transform} = this.props;
        const cursors = presence.getPeers().filter(peer =>
            peer.state.cursor && peer.state.cursor.surface === surface);
        if (!cursors.length) return null;
        return (
            <div className={styles.layer}>
                {cursors.map(peer => {
                    const cursor = peer.state.cursor;
                    const position = transform ? transform(cursor) : {
                        left: `${Math.max(0, Math.min(1, cursor.x)) * 100}%`,
                        top: `${Math.max(0, Math.min(1, cursor.y)) * 100}%`
                    };
                    return (
                        <div
                            className={styles.cursor}
                            key={peer.id}
                            style={position}
                        >
                            <svg
                                className={styles.pointer}
                                height="18"
                                viewBox="0 0 24 24"
                                width="18"
                            >
                                <path
                                    d="M5 2l14 9-6.5 1.5L9 19z"
                                    fill={peer.color}
                                    stroke="#ffffff"
                                    strokeLinejoin="round"
                                    strokeWidth="1.25"
                                />
                            </svg>
                            <span
                                className={styles.label}
                                style={{backgroundColor: peer.color}}
                                title={peer.state.dragging ? `${peer.username} (dragging a block)` : peer.username}
                            >
                                {peer.username}
                                {peer.state.dragging ? (
                                    <span className={styles.dragBadge}>{'⠿'}</span>
                                ) : null}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }
}

PresenceCursors.propTypes = {
    surface: PropTypes.oneOf(['stage', 'blocks']).isRequired,
    transform: PropTypes.func,
    highlightDragged: PropTypes.bool,
    highlightRoot: PropTypes.object,
    vm: PropTypes.object.isRequired
};

export default PresenceCursors;
