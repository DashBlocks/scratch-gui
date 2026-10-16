import Hammer from 'hammerjs';
import {BLOCKS_DEFAULT_SCALE} from './layout-constants';

const SCALE_MIN = 0.25;
const SCALE_MAX = 4;

const clampScale = scale => Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));

/**
 * Pinch-to-zoom, two-finger pan and double-tap zoom for a scratch-blocks
 * workspace on touch screens. One-finger gestures are left to scratch-blocks
 * (block dragging and view panning) and to page scrolling.
 */
class WorkspaceGestures {
    constructor (workspace, element) {
        this.workspace = workspace;
        this.element = element;
        this.pinchStartScale = null;
        this.panLast = null;

        this.manager = new Hammer.Manager(element, {
            touchAction: 'auto',
            inputClass: Hammer.TouchInput
        });
        const pinch = new Hammer.Pinch();
        const pan = new Hammer.Pan({event: 'pan2', pointers: 2, threshold: 5});
        const doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
        pinch.recognizeWith(pan);
        this.manager.add([pinch, pan, doubleTap]);

        this.handlePinchStart = this.handlePinchStart.bind(this);
        this.handlePinchMove = this.handlePinchMove.bind(this);
        this.handlePinchEnd = this.handlePinchEnd.bind(this);
        this.handlePanStart = this.handlePanStart.bind(this);
        this.handlePanMove = this.handlePanMove.bind(this);
        this.handlePanEnd = this.handlePanEnd.bind(this);
        this.handleDoubleTap = this.handleDoubleTap.bind(this);

        this.manager.on('pinchstart', this.handlePinchStart);
        this.manager.on('pinchmove', this.handlePinchMove);
        this.manager.on('pinchend pinchcancel', this.handlePinchEnd);
        this.manager.on('pan2start', this.handlePanStart);
        this.manager.on('pan2move', this.handlePanMove);
        this.manager.on('pan2end pan2cancel', this.handlePanEnd);
        this.manager.on('doubletap', this.handleDoubleTap);
    }
    destroy () {
        if (this.manager) this.manager.destroy();
        this.manager = null;
    }
    contentOrigin () {
        // The workspace content origin on screen, matching the formula used
        // by handleDrop/`presenceTransform` in containers/blocks.jsx.
        const ws = this.workspace;
        const scrollbar = ws && ws.scrollbar;
        if (!scrollbar || !scrollbar.hScroll || !scrollbar.vScroll) return null;
        return {
            left: scrollbar.hScroll.outerSvg_.getBoundingClientRect().left,
            top: scrollbar.vScroll.outerSvg_.getBoundingClientRect().top
        };
    }
    applyView () {
        const ws = this.workspace;
        ws.resize();
    }
    /**
     * Zoom to a scale while keeping the content point under (clientX, clientY)
     * fixed on screen.
     */
    zoomAround (clientX, clientY, nextScale) {
        const ws = this.workspace;
        const origin = this.contentOrigin();
        if (!ws || !origin) return;
        const scale = ws.scale || 1;
        const contentX = (clientX - origin.left - ws.scrollX) / scale;
        const contentY = (clientY - origin.top - ws.scrollY) / scale;
        const clamped = clampScale(nextScale);
        ws.scale = clamped;
        ws.scrollX = clientX - origin.left - contentX * clamped;
        ws.scrollY = clientY - origin.top - contentY * clamped;
        this.applyView();
    }
    handlePinchStart () {
        this.pinchStartScale = this.workspace.scale || 1;
    }
    handlePinchMove (event) {
        if (!this.pinchStartScale) return;
        if (event.srcEvent && event.srcEvent.preventDefault) event.srcEvent.preventDefault();
        this.zoomAround(event.center.x, event.center.y, this.pinchStartScale * event.scale);
    }
    handlePinchEnd () {
        this.pinchStartScale = null;
    }
    handlePanStart (event) {
        this.panLast = {x: event.center.x, y: event.center.y};
    }
    handlePanMove (event) {
        if (!this.panLast) return;
        if (event.srcEvent && event.srcEvent.preventDefault) event.srcEvent.preventDefault();
        const ws = this.workspace;
        ws.scrollX += event.center.x - this.panLast.x;
        ws.scrollY += event.center.y - this.panLast.y;
        this.panLast = {x: event.center.x, y: event.center.y};
        this.applyView();
    }
    handlePanEnd () {
        this.panLast = null;
    }
    handleDoubleTap (event) {
        // Only zoom when tapping empty workspace, not a block (blocks use
        // double-tap/click for their own interactions).
        const target = event.srcEvent && event.srcEvent.target;
        if (target && target.closest && target.closest('[data-id]')) return;
        const scale = this.workspace.scale || 1;
        const targetScale = scale < 0.95 ? 1 : BLOCKS_DEFAULT_SCALE;
        this.zoomAround(event.center.x, event.center.y, targetScale);
    }
}

/**
 * Attach touch gestures to a workspace.
 * @param {Workspace} workspace scratch-blocks workspace
 * @param {HTMLElement} element element that receives touch events
 * @returns {WorkspaceGestures} call .destroy() to detach
 */
const enableWorkspaceGestures = (workspace, element) => new WorkspaceGestures(workspace, element);

export default enableWorkspaceGestures;
