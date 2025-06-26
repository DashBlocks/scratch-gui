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
            costumes: [
                {
                    name: "Dash Backdrop",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    assetId: "d7f058f241a41eb562c629571b12254b",
                    md5ext: "d7f058f241a41eb562c629571b12254b.svg",
                    rotationCenterX: 290.08191999999997,
                    rotationCenterY: 165.80746
                }
            ],
            sounds: [],
            volume: 100,
            layerOrder: 0,
            tempo: 60,
            videoTransparency: 50,
            videoState: "on",
            textToSpeechLanguage: null
        },
        {
            isStage: false,
            name: "Dashy",
            objName: 'Dashy',
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {
                c: {
                    opcode: "event_whenflagclicked",
                    next: "d",
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 234,
                    y: 136,
                    comment: "h"
                },
                d: {
                    opcode: "motion_gotoxy",
                    next: "a",
                    parent: "c",
                    inputs: {
                        X: [1, [4, "0"]],
                        Y: [1, [4, "0"]]
                    },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                a: {
                    opcode: "looks_switchcostumeto",
                    next: "e",
                    parent: "d",
                    inputs: { COSTUME: [1, "i"] },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                i: {
                    opcode: "looks_costume",
                    next: null,
                    parent: "a",
                    inputs: {},
                    fields: { COSTUME: ["Dashy2", null] },
                    shadow: true,
                    topLevel: false
                },
                e: {
                    opcode: "control_wait",
                    next: "b",
                    parent: "a",
                    inputs: { DURATION: [1, [5, "3"]] },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                b: {
                    opcode: "looks_switchcostumeto",
                    next: "f",
                    parent: "e",
                    inputs: { COSTUME: [1, "j"] },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                j: {
                    opcode: "looks_costume",
                    next: null,
                    parent: "b",
                    inputs: {},
                    fields: { COSTUME: ["Dashy3", null] },
                    shadow: true,
                    topLevel: false
                },
                f: {
                    opcode: "control_wait",
                    next: "g",
                    parent: "b",
                    inputs: { DURATION: [1, [5, "3"]] },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                g: {
                    opcode: "looks_switchcostumeto",
                    next: null,
                    parent: "f",
                    inputs: { COSTUME: [1, "k"] },
                    fields: {},
                    shadow: false,
                    topLevel: false
                },
                k: {
                    opcode: "looks_costume",
                    next: null,
                    parent: "g",
                    inputs: {},
                    fields: { COSTUME: ["Dashy4", null] },
                    shadow: true,
                    topLevel: false
                }
            },
            comments: {
                h: {
                    blockId: "c",
                    x: 517.3106466222692,
                    y: 141.03703703703704,
                    width: 479.0123291015625,
                    height: 144.9382781982422,
                    minimized: false,
                    text: "Hello, welcome to the Dash editor!\nDash is a TurboWarp and PenguinMod mod with new features. Don't wait, start creating right now!"
                }
            },
            currentCostume: 3,
            costumes: [
                {
                    name: "Dashy",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    assetId: "52054ba69ddc88a2b32de72ca9d4b502",
                    md5ext: "52054ba69ddc88a2b32de72ca9d4b502.svg",
                    rotationCenterX: 63.434549598065985,
                    rotationCenterY: 54.423761890477465
                },
                {
                    name: "Dashy2",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    assetId: "ffda3f9a80afaaa9dbe00292f892e46e",
                    md5ext: "ffda3f9a80afaaa9dbe00292f892e46e.svg",
                    rotationCenterX: 63.43454371284392,
                    rotationCenterY: 96.0693062350621
                },
                {
                    name: "Dashy3",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    assetId: "d3f97e3555feeea9c292eb9a52c5d592",
                    md5ext: "d3f97e3555feeea9c292eb9a52c5d592.svg",
                    rotationCenterX: 63.4345491554551,
                    rotationCenterY: 101.27660173199448
                },
                {
                    name: "Dashy4",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    assetId: "a30c76b27d418899ffcabc35097ccfe7",
                    md5ext: "a30c76b27d418899ffcabc35097ccfe7.svg",
                    rotationCenterX: 63.43454827023319,
                    rotationCenterY: 93.53013916746339
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
            rotationStyle: "all around"
        }
    ],
    monitors: [],
    extensions: [],
    meta: {
        semver: "3.0.0",
        vm: "0.2.0",
        agent: "",
        platform: {
            name: "Dash",
            url: "https://dashblocks.github.io/"
        }
    }
    })
};


export default projectData;
