import messages from './tag-messages.js';

export default [
    {tag: 'scratch', intlLabel: 'Scratch'}, // Because is a brand name, it's unnecessary for to be translatable.
    {tag: 'dash', intlLabel: messages.dash},
    {tag: 'tw', intlLabel: 'TurboWarp'}, // Because is a brand name, it's unnecessary for to be translatable.
    {tag: 'other', intlLabel: messages.other}
];
