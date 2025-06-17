// TODO: Make an Extension Gallery for Dash

import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import extensions from '../../../extensions/src/lib/extensions.js';
import pmExtensions from '../../../PenguinMod-ExtensionsGallery/src/lib/extensions.js';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import log from '../lib/log';

import extensionLibraryContent, {
    galleryError,
    galleryLoading,
    galleryMore // soon
} from '../lib/libraries/extensions/index.jsx';
import extensionTags from '../lib/libraries/tw-extension-tags';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    }
});

const toLibraryItem = extension => {
    if (typeof extension === 'object') {
        return ({
            rawURL: extension.iconURL || extensionIcon,
            ...extension
        });
    }
    return extension;
};

const translateGalleryItem = (extension, locale) => ({
    ...extension,
    name: extension.nameTranslations[locale] || extension.name,
    description: extension.descriptionTranslations[locale] || extension.description
});

let cachedTwGallery = null;
let cachedPmGallery = null;
let cachedGallery = null;

const fetchTwLibrary = async () => {
    const res = await fetch('https://extensions.turbowarp.org/generated-metadata/extensions-v0.json');
    if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
    }
    const data = await res.json();
    return data.extensions.map(extension => ({
        name: extension.name,
        nameTranslations: extension.nameTranslations || {},
        description: extension.description,
        descriptionTranslations: extension.descriptionTranslations || {},
        extensionId: extension.id,
        extensionURL: `https://extensions.turbowarp.org/${extension.slug}.js`,
        iconURL: `https://extensions.turbowarp.org/${extension.image || 'images/unknown.svg'}`,
        tags: ['tw'],
        credits: [
            ...(extension.original || []),
            ...(extension.by || [])
        ].map(credit => {
            if (credit.link) {
                return (
                    <a
                        href={credit.link}
                        target="_blank"
                        rel="noreferrer"
                        key={credit.name}
                    >
                        {credit.name}
                    </a>
                );
            }
            return credit.name;
        }),
        docsURI: extension.docs ? `https://extensions.turbowarp.org/${extension.slug}` : null,
        samples: extension.samples ? extension.samples.map(sample => ({
            href: `${process.env.ROOT}editor?project_url=https://extensions.turbowarp.org/samples/${encodeURIComponent(sample)}.sb3`,
            text: sample
        })) : null,
        incompatibleWithScratch: !extension.scratchCompatible,
        featured: true
    }));
};

const fetchPmLibrary = async () => {
    return pmExtensions.map((extension, index) => ({
        name: extension.name,
        nameTranslations: extension.nameTranslations || {},
        description: extension.description,
        descriptionTranslations: extension.descriptionTranslations || {},
        extensionId: `pm_extension_index${index}`, // Metadata of PM extensions doesn't have extensions IDs, but we need ID value as string for apply some styles and Favorite/Unfavorite working
        extensionURL: `https://extensions.penguinmod.com/extensions/${extension.code}`,
        iconURL: `https://extensions.penguinmod.com/images/${extension.banner || 'unknown.svg'}`,
        tags: ['pm'],
        credits: [
            ...(typeof extension.creator == 'object' ? extension.creator : [extension.creator] || []),
            ...(extension.notes ? [extension.notes] : [])
        ].map(credit => {
            if (extension.notes && credit == extension.notes) return credit;
            return (
                <a
                    href={extension.isGitHub ? `https://github.com/${credit}` : `https://scratch.mit.edu/users/${credit}`}
                    target="_blank"
                    rel="noreferrer"
                    key={credit}
                >
                    {credit}
                </a>
            );
        }),
        docsURI: extension.documentation ? `https://extensions.penguinmod.com/docs/${extension.documentation}` : null,
        samples: null,
        incompatibleWithScratch: !extension.scratchCompatible || true,
        featured: true
    }));
};

const fetchLibrary = async () => {
    return extensions.map(extension => ({
        name: extension.name,
        nameTranslations: extension.nameTranslations || {},
        description: extension.description,
        descriptionTranslations: extension.descriptionTranslations || {},
        extensionId: extension.id,
        extensionURL: `https://dashblocks.github.io/extensions/static/extensions/${extension.code}`,
        iconURL: `https://dashblocks.github.io/extensions/static/images/${extension.banner || 'unknown.svg'}`,
        tags: ['dash'],
        credits: [
            ...(typeof extension.creator == 'object' ? extension.creator : [extension.creator] || []),
            ...(extension.notes ? [extension.notes] : [])
        ].map(credit => {
            if (extension.notes && credit == extension.notes) return credit;
            return (
                <a
                    href={extension.isGitHub ? `https://github.com/${credit}` : `https://scratch.mit.edu/users/${credit}`}
                    target="_blank"
                    rel="noreferrer"
                    key={credit}
                >
                    {credit}
                </a>
            );
        }),
        docsURI: extension.documentation ? `https://dashblocks.github.io/extensions/src/lib/Documentation/${extension.documentation}.md` : null,
        samples: /*extension.samples ? extension.samples.map(sample => ({
            href: `${process.env.ROOT}editor?project_url=https://extensions.turbowarp.org/samples/${encodeURIComponent(sample)}.sb3`,
            text: sample
        })) :*/ null,
        incompatibleWithScratch: !extension.scratchCompatible || true,
        featured: true
    }));
};

class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);
        this.state = {
            pmGallery: cachedPmGallery,
            twGallery: cachedTwGallery,
            gallery: cachedGallery,
            galleryError: null,
            galleryTimedOut: false
        };
    }
    componentDidMount () {
        if (!this.state.gallery) {
            const timeout = setTimeout(() => {
                this.setState({
                    galleryTimedOut: true
                });
            }, 750);

            fetchTwLibrary()
                .then(gallery => {
                    cachedTwGallery = gallery;
                    this.setState({
                        twGallery: gallery
                    });
                    clearTimeout(timeout);
                })
                .catch(error => {
                    log.error(error);
                    this.setState({
                        galleryError: error
                    });
                    clearTimeout(timeout);
                });

            
            fetchPmLibrary()
                .then(gallery => {
                    cachedPmGallery = gallery;
                    this.setState({
                        pmGallery: gallery
                    });
                    clearTimeout(timeout);
                })
                .catch(error => {
                    log.error(error);
                    this.setState({
                        galleryError: error
                    });
                    clearTimeout(timeout);
                });

            fetchLibrary()
                .then(gallery => {
                    cachedGallery = gallery;
                    this.setState({
                        gallery
                    });
                    clearTimeout(timeout);
                })
                .catch(error => {
                    log.error(error);
                    this.setState({
                        galleryError: error
                    });
                    clearTimeout(timeout);
                });
        }
    }
    handleItemSelect (item) {
        if (item.href) {
            return;
        }

        const extensionId = item.extensionId;

        if (extensionId === 'custom_extension') {
            this.props.onOpenCustomExtensionModal();
            return;
        }

        if (extensionId === 'procedures_enable_return') {
            this.props.onEnableProcedureReturns();
            this.props.onCategorySelected('myBlocks');
            return;
        }

        const url = item.extensionURL ? item.extensionURL : extensionId;
        if (!item.disabled) {
            if (this.props.vm.extensionManager.isExtensionLoaded(extensionId)) {
                this.props.onCategorySelected(extensionId);
            } else {
                this.props.vm.extensionManager.loadExtensionURL(url)
                    .then(() => {
                        this.props.onCategorySelected(extensionId);
                    })
                    .catch(err => {
                        log.error(err);
                        // eslint-disable-next-line no-alert
                        alert(err);
                    });
            }
        }
    }
    render () {
        let library = [];
        const locale = this.props.intl.locale;

        library = extensionLibraryContent.map(toLibraryItem);

        library.push('---');
        
        if (this.state.gallery) {
            library.push(toLibraryItem(galleryMore));
            library.push(
                ...this.state.gallery
                    .map(i => translateGalleryItem(i, locale))
                    .map(toLibraryItem)
            );
        } else if (this.state.galleryTimedOut && !this.state.gallery) {
            library.push(toLibraryItem(galleryLoading));
        } else if (this.state.galleryError && !this.state.gallery) {
            library.push(toLibraryItem(galleryError));
        }

        library.push('---');

        if (this.state.twGallery) {
            library.push(
                ...this.state.twGallery
                    .map(i => translateGalleryItem(i, locale))
                    .map(toLibraryItem)
            );
        } else if (this.state.galleryTimedOut && !this.state.twGallery) {
            library.push(toLibraryItem(galleryLoading));
        } else if (this.state.galleryError && !this.state.twGallery) {
            library.push(toLibraryItem(galleryError));
        }

        library.push('---');

        if (this.state.pmGallery) {
            library.push(
                ...this.state.pmGallery
                    .map(i => translateGalleryItem(i, locale))
                    .map(toLibraryItem)
            );
        } else if (this.state.galleryTimedOut && !this.state.pmGallery) {
            library.push(toLibraryItem(galleryLoading));
        } else if (this.state.galleryError && !this.state.pmGallery) {
            library.push(toLibraryItem(galleryError));
        }

        return (
            <LibraryComponent
                data={library}
                filterable
                persistableKey="extensionId"
                id="extensionLibrary"
                tags={extensionTags}
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onEnableProcedureReturns: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired // eslint-disable-line react/no-unused-prop-types
};

export default injectIntl(ExtensionLibrary);
