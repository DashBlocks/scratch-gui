import messages from './tag-messages.js';
import tagGroupMessages from './dash-tag-group-messages.js';
export default [
    {tag: 'dash', intlLabel: messages.dash},
    '---',
    {isGroup: true, intlLabel: tagGroupMessages.category},
    {tag: 'fantasy', intlLabel: messages.fantasy},
    {tag: 'music', intlLabel: messages.music},
    {tag: 'sports', intlLabel: messages.sports},
    {tag: 'outdoors', intlLabel: messages.outdoors},
    {tag: 'indoors', intlLabel: messages.indoors},
    {tag: 'space', intlLabel: messages.space},
    {tag: 'underwater', intlLabel: messages.underwater},
    {tag: 'patterns', intlLabel: messages.patterns}
];
