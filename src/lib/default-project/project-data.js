import {defineMessages} from 'react-intl';
import sharedMessages from '../shared-messages';

let messages = defineMessages({
    variable: {
        defaultMessage: 'my variable',
        description: 'Name for the default variable',
        id: 'gui.defaultProject.variable'
    }
});

messages = {...messages, ...sharedMessages};

// use the default message if a translation function is not passed
const defaultTranslator = msgObj => msgObj.defaultMessage;

/**
 * Generate a localized version of the default project
 * @param {function} translateFunction a function to use for translating the default names
 * @return {object} the project data json for the default project
 */
const projectData = translateFunction => {
    const translator = translateFunction || defaultTranslator;
    return ({
        targets: [
            {
                isStage: true,
                name: 'Stage',
                objName: 'Stage',
                variables: {
                    '`jEk@4|i[#Fk?(8x)AV.-my variable': [
                        translator(messages.variable),
                        0
                    ]
                },
                lists: {},
                broadcasts: {},
                blocks: {},
                comments: {},
                currentCostume: 0,
                costumes: [],
                sounds: [],
                volume: 100,
                layerOrder: 0,
                tempo: 60,
                videoTransparency: 50,
                videoState: 'on',
                textToSpeechLanguage: null
            },
            {
                isStage: false,
                name: 'Dashy',
                objName: 'Dashy',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                comments: {},
                currentCostume: 1,
                costumes: [
                    {
                        name: 'Dashy',
                        bitmapResolution: 1,
                        dataFormat: 'svg',
                        assetId: '52054ba69ddc88a2b32de72ca9d4b502',
                        md5ext: '52054ba69ddc88a2b32de72ca9d4b502.svg',
                        rotationCenterX: 63.434549598065985,
                        rotationCenterY: 54.423761890477465
                    }
                ],
                sounds: [],
                volume: 100,
                layerOrder: 1,
                visible: true,
                x: 0,
                y: 0,
                size: 100,
                direction: 90,
                draggable: false,
                rotationStyle: 'all around'
            }
        ],
        monitors: [],
        extensions: [],
        meta: {
            semver: '3.0.0',
            vm: '0.2.0',
            agent: '',
            platform: {
                name: 'Dash',
                url: 'https://dashblocks.org/'
            }
        }
    });
};


export default projectData;
