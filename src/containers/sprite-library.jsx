import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape, defineMessages} from 'react-intl';
import VM from 'scratch-vm';

import {costumeUpload, soundUpload} from '../lib/file-uploader.js';
import {getSpriteLibrary} from '../lib/libraries/tw-async-libraries';
import {handleAssetLoad} from '../lib/libraries/dash-web-libraries';
import randomizeSpritePosition from '../lib/randomize-sprite-position';
import spriteTags from '../lib/libraries/sprite-tags';

import LibraryComponent from '../components/library/library.jsx';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sprite',
        description: 'Heading for the sprite library',
        id: 'gui.spriteLibrary.chooseASprite'
    }
});

class SpriteLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);
        this.state = {
            data: getSpriteLibrary()
        };
    }
    componentDidMount () {
        if (this.state.data.then) {
            this.state.data.then(data => this.setState({
                data
            }));
        }
    }
    async handleItemSelect (item) {
        if (!this.props.vm.canEditCollaboration()) return;
        // Create clone of library item
        item = {...item};
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        const costumes = [];
        for (let costume of item.costumes) {
            if (costume.src) {
                const generatedCostumes = await handleAssetLoad(
                    costume.src.library,
                    costume.src.path,
                    (buffer, fileType) => new Promise(resolve => {
                        costumeUpload(buffer, fileType, this.props.vm, vmCostumes => {
                            resolve(vmCostumes.map((vmCostume, i) => ({
                                assetId: vmCostume.assetId,
                                name: `${costume.name}${i ? i + 1 : ''}`,
                                bitmapResolution: costume.bitmapResolution,
                                md5ext: vmCostume.md5,
                                dataFormat: vmCostume.dataFormat,
                                rotationCenterX: costume.rotationCenterX,
                                rotationCenterY: costume.rotationCenterY
                            })));
                        });
                    })
                );
                costumes.push(...generatedCostumes);
            } else {
                costumes.push(costume);
            }
        }
        item.costumes = costumes;
        const sounds = [];
        for (let sound of item.sounds) {
            if (sound.src) {
                const generatedSounds = await handleAssetLoad(
                    sound.src.library,
                    sound.src.path,
                    (buffer, fileType) => new Promise(resolve => {
                        soundUpload(buffer, fileType, this.props.vm.runtime.storage, vmSound => {
                            resolve({
                                assetId: vmSound.assetId,
                                name: sound.name,
                                dataFormat: vmSound.dataFormat,
                                format: sound.format,
                                rate: sound.rate,
                                sampleCount: sound.sampleCount,
                                md5ext: vmSound.md5
                            });
                        });
                    })
                );
                sounds.push(...generatedSounds);
            } else {
                sounds.push(sound);
            }
        }
        item.sounds = sounds;
        this.props.vm.addSprite(JSON.stringify(item)).then(() => {
            this.props.onActivateBlocksTab();
        });
    }
    render () {
        return (
            <LibraryComponent
                data={this.state.data.then ? null : this.state.data}
                id="spriteLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                removedTrademarks
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

SpriteLibrary.propTypes = {
    intl: intlShape.isRequired,
    onActivateBlocksTab: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(SpriteLibrary);
