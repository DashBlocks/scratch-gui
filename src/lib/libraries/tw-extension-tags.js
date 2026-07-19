import messages from './tag-messages.js';
import tagGroupMessages from './dash-tag-group-messages.js';
export default [
    {isGroup: true, intlLabel: tagGroupMessages.platform},
    {tag: 'scratch', intlLabel: 'Scratch'}, // Because is a brand name, it's unnecessary for to be translatable.
    {tag: 'tsmod', intlLabel: messages.tsmod}, 
    {tag: 'neomod', intlLabel: messages.neomod},
    {tag: 'dash', intlLabel: messages.dash},
    {tag: 'tw', intlLabel: 'TurboWarp'}, // Because is a brand name, it's unnecessary for to be translatable.
    {tag: 'gallery', intlLabel: messages.gallery},
    {tag: 'other', intlLabel: messages.other}
];
