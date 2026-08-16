import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import log from '../lib/log';
import CustomExtensionModalComponent from '../components/tw-custom-extension-modal/custom-extension-modal.jsx';
import {closeCustomExtensionModal} from '../reducers/modals';
import {manuallyTrustExtension, isTrustedUrl} from './tw-security-manager.jsx';
import {getPersistedUnsandboxed, setPersistedUnsandboxed} from '../lib/tw-persisted-unsandboxed.js';

/**
 * @param {Blob} blob Blob
 * @returns {Promise<string>} data: uri
 */
const readAsDataURL = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read extension as data URL: ${reader.error}`));
    reader.readAsDataURL(blob);
});

const messages = defineMessages({
    swapWarning: {
        id: 'dash.customExtensionModal.swapWarning',
        // eslint-disable-next-line max-len
        defaultMessage: 'If extensions swap will fail, it will cause the extension to be flatout removed, are you sure the inputed extension has matching id\'s and has no errors?',
        description: 'Warning message when swapping (editing) extensions'
    },
    differentSwapId: {
        id: 'dash.customExtensionModal.differentSwapId',
        // eslint-disable-next-line max-len
        defaultMessage: 'The extension you used to for the edit had a different id to the one you where editing, so added it as new extension.',
        description: 'Warning message when the extension being swapped has a different ID'
    },
    swapFailed: {
        id: 'dash.customExtensionModal.swapFailed',
        defaultMessage: 'The extension you used to for the edit has failed to load.',
        description: 'Warning message when the extension being swapped fails to load'
    },
    extensionLoadFailed: {
        id: 'dash.customExtensionModal.extensionLoadFailed',
        defaultMessage: 'Failed to load extension.',
        description: 'Generic warning message when an extension fails to load'
    }
});

class CustomExtensionModal extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleChangeFiles',
            'handleChangeURL',
            'handleClose',
            'handleKeyDown',
            'handleLoadExtension',
            'handleSwitchToFile',
            'handleSwitchToURL',
            'handleSwitchToText',
            'handleChangeText',
            'handleDragOver',
            'handleDragLeave',
            'handleDrop',
            'handleChangeUnsandboxed'
        ]);

        this.state = {
            type: this.props.swapId ? 'text' : 'url',
            url: this.fetchSwapURL(),
            files: null,
            text: this.fetchSwapText(),
            unsandboxed: getPersistedUnsandboxed(),
            isTwGalleryMirror: false
        };
    }

    /**
     * @returns {Promise<string[]>} List of extension URLs to load.
     */
    getExtensionURLs () {
        if (this.state.type === 'url') {
            return Promise.resolve([
                this.state.url
            ]);
        }

        if (this.state.type === 'file') {
            const files = Array.from(this.state.files);
            return Promise.all(files.map(readAsDataURL));
        }

        if (this.state.type === 'text') {
            return Promise.resolve([
                `data:application/javascript,${encodeURIComponent(this.state.text)}`
            ]);
        }

        return Promise.reject(new Error('Unknown type'));
    }

    hasValidInput () {
        if (this.state.type === 'url') {
            try {
                const parsed = new URL(this.state.url);
                return (
                    parsed.protocol === 'https:' ||
                    parsed.protocol === 'http:' ||
                    parsed.protocol === 'data:'
                );
            } catch (e) {
                return false;
            }
        }

        if (this.state.type === 'file') {
            return !!this.state.files;
        }

        if (this.state.type === 'text') {
            return !!this.state.text;
        }

        return false;
    }

    handleChangeFiles (files) {
        this.setState({
            files
        });
    }

    handleChangeURL (e) {
        this.setState({
            url: e.target.value
        });
    }

    handleClose () {
        this.props.onClose();
    }

    handleKeyDown (e) {
        if (e.key === 'Enter' && this.hasValidInput()) {
            e.preventDefault();
            this.handleLoadExtension();
        }
    }

    async handleLoadExtension () {
        let failed = false;
        if (this.props.swapId) {
            /* eslint-disable-next-line no-alert */
            if (!confirm(this.props.intl.formatMessage(messages.swapWarning))) {
                return;
            }
        }
        this.handleClose();
        try {
            const urls = await this.getExtensionURLs();

            if (this.state.type !== 'url') {
                setPersistedUnsandboxed(this.state.unsandboxed);
                if (this.state.unsandboxed) {
                    for (const url of urls) {
                        manuallyTrustExtension(url);
                    }
                }
            }

            for (const url of urls) {
                if (this.props.swapId) {
                    const runtime = this.props.vm.runtime;
                    this.props.vm.extensionManager.prepareSwap(this.props.swapId);
                    let extIdx = runtime._blockInfo.findIndex(ext => ext.id === this.props.swapId);
                    await this.props.vm.extensionManager.loadExtensionURL(url);
                    const loadedIds = this.props.vm.extensionManager.extensionsIDs;
                    if (!loadedIds.includes(this.props.swapId)) {
                        for (const ext of loadedIds) this.props.vm.extensionManager.removeExtension(ext);
                        // eslint-disable-next-line no-alert
                        alert(this.props.intl.formatMessage(messages.differentSwapId));
                        return;
                    }
                    this.props.vm.runtime._removeExtensionPrimitive(this.props.swapId);
                    loadedIds.forEach(extId => {
                        const idx = runtime._blockInfo.findLastIndex(ext => ext.id === extId);
                        const ext = runtime._blockInfo[idx];
                        runtime._blockInfo.splice(idx, 1);
                        runtime._blockInfo.splice(extIdx, 0, ext);
                        extIdx++;
                    });
                } else {
                    if (url.startsWith('https://extensions.turbowarp.org/')) {
                        try {
                            const res = await fetch(url);
                            if (!res.ok) {
                                this.setState({
                                    isTwGalleryMirror: true
                                });
                                await this.props.vm.extensionManager.loadExtensionURL(
                                    url.replace(
                                        'https://extensions.turbowarp.org/',
                                        'https://dashblocks.org/tw-extensions/'
                                    )
                                );
                                return;
                            }
                        } catch (_) {
                            this.setState({
                                isTwGalleryMirror: true
                            });
                            await this.props.vm.extensionManager.loadExtensionURL(
                                url.replace(
                                    'https://extensions.turbowarp.org/',
                                    'https://dashblocks.org/tw-extensions/'
                                )
                            );
                            return;
                        }
                    }
                    this.setState({
                        isTwGalleryMirror: false
                    });
                    await this.props.vm.extensionManager.loadExtensionURL(url);
                }
            }
        } catch (err) {
            failed = true;
            log.error(err);
            // eslint-disable-next-line no-alert
            alert(err);
        } finally {
            if (failed) {
                if (this.props.swapId) {
                    // eslint-disable-next-line no-alert
                    alert(this.props.intl.formatMessage(messages.swapFailed));
                    this.props.vm.runtime._removeExtensionPrimitive(this.props.swapId);
                } else {
                    // eslint-disable-next-line no-alert
                    alert(this.props.intl.formatMessage(messages.extensionLoadFailed));
                }
            }
        }
    }

    handleSwitchToFile () {
        this.setState({
            type: 'file'
        });
    }

    handleSwitchToURL () {
        this.setState({
            type: 'url'
        });
    }

    handleSwitchToText () {
        this.setState({
            type: 'text'
        });
    }

    handleChangeText (e) {
        this.setState({
            text: e.target.value
        });
    }

    handleDragOver (e) {
        if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }

    handleDragLeave () {

    }

    handleDrop (e) {
        const files = e.dataTransfer.files;
        if (files.length) {
            e.preventDefault();
            this.setState({
                type: 'file',
                files
            });
        }
    }

    isUnsandboxed () {
        if (this.state.type === 'url') {
            return isTrustedUrl(this.state.url);
        }
        return this.state.unsandboxed;
    }

    canChangeUnsandboxed () {
        return this.state.type !== 'url';
    }

    handleChangeUnsandboxed (e) {
        this.setState({
            unsandboxed: e.target.checked
        });
    }

    fetchSwapURL () {
        return this.props.vm.extensionManager.extensionURLFromId(this.props.swapId) ?? '';
    }

    fetchSwapText () {
        return this.props.vm.extensionManager.extensionsURLCodes[this.fetchSwapURL()] ?? '';
    }

    render () {
        return (
            <CustomExtensionModalComponent
                canLoadExtension={this.hasValidInput()}
                type={this.state.type}
                onSwitchToFile={this.handleSwitchToFile}
                onSwitchToURL={this.handleSwitchToURL}
                onSwitchToText={this.handleSwitchToText}
                files={this.state.files}
                onChangeFiles={this.handleChangeFiles}
                onDragOver={this.handleDragOver}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}
                url={this.state.url}
                onChangeURL={this.handleChangeURL}
                onKeyDown={this.handleKeyDown}
                text={this.state.text}
                onChangeText={this.handleChangeText}
                unsandboxed={this.isUnsandboxed()}
                onChangeUnsandboxed={this.canChangeUnsandboxed() ? this.handleChangeUnsandboxed : null}
                onLoadExtension={this.handleLoadExtension}
                onClose={this.handleClose}
            />
        );
    }
}

CustomExtensionModal.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func,
    vm: PropTypes.shape({
        extensionManager: PropTypes.shape({
            loadExtensionURL: PropTypes.func,
            getExtensionURLs: PropTypes.func,
            extensionsURLCodes: PropTypes.object,
            prepareSwap: PropTypes.func,
            extensionURLFromId: PropTypes.func,
            removeExtension: PropTypes.func,
            extensionsIDs: PropTypes.array
        }),
        runtime: PropTypes.shape({
            _removeExtensionPrimitive: PropTypes.func,
            _blockInfo: PropTypes.array
        })
    }),
    swapId: PropTypes.string
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    swapId: state.scratchGui.modals.extensionSwapId
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeCustomExtensionModal())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(CustomExtensionModal));
