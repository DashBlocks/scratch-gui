import PropTypes from 'prop-types';
import React from 'react';
import {CURSOR_EVENT} from '../../lib/dash-collaboration-social';
import * as styles from './cursors.css';

class CollaborationCursors extends React.Component {
    constructor (props) {
        super(props);
        this.state = {peers: []};
        this.nodes = new Map();
        this.layer = React.createRef();
        this.pointer = null;
        this.refresh = this.refresh.bind(this);
        this.frame = this.frame.bind(this);
        this.move = this.move.bind(this);
        this.hide = this.hide.bind(this);
    }
    componentDidMount () {
        this.props.vm.on(CURSOR_EVENT, this.refresh);
        this.props.vm.on('DASH_COLLABORATION_STATUS', this.refresh);
        this.props.vm.on('targetsUpdate', this.refresh);
        document.addEventListener('pointermove', this.move);
        document.addEventListener('pointerout', this.hide);
        document.addEventListener('visibilitychange', this.hide);
        window.addEventListener('blur', this.hide);
        this.refresh();
    }
    componentDidUpdate (previous) {
        if (previous.visible !== this.props.visible) this.refresh();
    }
    componentWillUnmount () {
        this.props.vm.removeListener(CURSOR_EVENT, this.refresh);
        this.props.vm.removeListener('DASH_COLLABORATION_STATUS', this.refresh);
        this.props.vm.removeListener('targetsUpdate', this.refresh);
        document.removeEventListener('pointermove', this.move);
        document.removeEventListener('pointerout', this.hide);
        document.removeEventListener('visibilitychange', this.hide);
        window.removeEventListener('blur', this.hide);
        cancelAnimationFrame(this.animation);
        this.clearLocal();
    }
    getSocial () {
        const session = this.props.vm.dashCollaboration;
        return session && session.state === 'connected' && this.props.visible ? session.social : null;
    }
    clearLocal () {
        const session = this.props.vm.dashCollaboration;
        const social = session && session.social;
        if (social && social.localCursor && social.localCursor.surface === this.props.surface) {
            social.updateCursor(null);
        }
    }
    hide (event) {
        if (event.type === 'pointerout' && event.relatedTarget) return;
        this.pointer = null;
        this.clearLocal();
    }
    move (event) {
        this.pointer = {x: event.clientX, y: event.clientY};
    }
    refresh () {
        const social = this.getSocial();
        const target = this.props.vm.editingTarget;
        const peers = social ? [...social.cursors.values()].filter(peer =>
            peer.cursor.surface === this.props.surface &&
            (this.props.surface === 'stage' || (target && peer.cursor.targetId === target.collaborationId))) : [];
        this.setState({peers});
        if (social && !this.animation) this.animation = requestAnimationFrame(this.frame);
        if (!social) {
            cancelAnimationFrame(this.animation);
            this.animation = null;
            this.clearLocal();
        }
    }
    geometry () {
        const layer = this.layer.current;
        if (!layer) return null;
        const host = layer.parentElement;
        const bounds = layer.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return null;
        if (this.props.surface === 'stage') {
            const canvas = this.props.canvas;
            if (!canvas) return null;
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return null;
            return {
                host,
                bounds,
                rect,
                toLocal: point => ({x: (point.x - rect.left) / rect.width, y: (point.y - rect.top) / rect.height}),
                toScreen: point => ({x: rect.left + (point.x * rect.width), y: rect.top + (point.y * rect.height)})
            };
        }
        const workspace = this.props.getSurface();
        if (!workspace || !workspace.getCanvas()) return null;
        const matrix = workspace.getCanvas().getScreenCTM();
        const metrics = workspace.getMetrics();
        if (!matrix || !metrics || !matrix.a || !matrix.d) return null;
        const svg = workspace.getParentSvg().getBoundingClientRect();
        const flyout = metrics.flyoutWidth || 0;
        const left = svg.left + metrics.absoluteLeft + (workspace.RTL ? 0 : flyout);
        const right = svg.left + metrics.absoluteLeft + metrics.viewWidth - (workspace.RTL ? flyout : 0);
        const top = svg.top + metrics.absoluteTop;
        const rect = {left, right, top, bottom: top + metrics.viewHeight};
        const inverse = matrix.inverse();
        return {
            host,
            bounds,
            rect,
            toLocal: point => new DOMPoint(point.x, point.y).matrixTransform(inverse),
            toScreen: point => new DOMPoint(point.x, point.y).matrixTransform(matrix)
        };
    }
    frame () {
        this.animation = null;
        const social = this.getSocial();
        if (!social) return;
        const geometry = this.geometry();
        const inside = point => geometry && point.x >= geometry.rect.left && point.x <= geometry.rect.right &&
            point.y >= geometry.rect.top && point.y <= geometry.rect.bottom;
        const element = this.pointer && !document.hidden ?
            document.elementFromPoint(this.pointer.x, this.pointer.y) : null;
        if (inside(this.pointer || {x: NaN, y: NaN}) && element && geometry.host.contains(element)) {
            const point = geometry.toLocal(this.pointer);
            const target = this.props.vm.editingTarget;
            social.updateCursor({
                surface: this.props.surface,
                x: point.x,
                y: point.y,
                targetId: target ? target.collaborationId : null
            });
        } else this.clearLocal();
        for (const peer of this.state.peers) {
            const node = this.nodes.get(peer.id);
            if (!node) continue;
            const point = geometry && geometry.toScreen(peer.cursor);
            node.style.display = point && inside(point) ? '' : 'none';
            if (point) {
                node.style.transform =
                    `translate(${point.x - geometry.bounds.left}px, ${point.y - geometry.bounds.top}px)`;
            }
        }
        this.animation = requestAnimationFrame(this.frame);
    }
    render () {
        return (
            <div
                aria-hidden="true"
                className={styles.layer}
                ref={this.layer}
            >
                {this.state.peers.map(peer => (
                    <div
                        className={styles.cursor}
                        key={peer.id}
                        ref={node => {
                            if (node) this.nodes.set(peer.id, node);
                            else this.nodes.delete(peer.id);
                        }}
                        style={{color: peer.color}}
                    >
                        <svg
                            height="20"
                            viewBox="0 0 24 24"
                            width="20"
                        >
                            <path
                                d="M3 2l17 12-8 1-4 7z"
                                fill="currentColor"
                                stroke="white"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                            />
                        </svg>
                        <span
                            className={styles.name}
                            style={{backgroundColor: peer.color}}
                        >{peer.username}</span>
                    </div>
                ))}
            </div>
        );
    }
}

CollaborationCursors.propTypes = {
    canvas: PropTypes.object,
    getSurface: PropTypes.func,
    surface: PropTypes.oneOf(['blocks', 'stage']).isRequired,
    visible: PropTypes.bool,
    vm: PropTypes.object.isRequired
};
CollaborationCursors.defaultProps = {visible: true};

export default CollaborationCursors;
