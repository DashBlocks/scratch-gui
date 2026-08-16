// https://github.com/LLK/scratch-www/blob/25232a06bcceeaddec8fcb24fb63a44d870cf1cf/src/lib/decorate-text.jsx

import React from 'react';
import reactStringReplace from 'react-string-replace';

const decorate = (text, isDashProject) => {
    // Make links clickable
    const linkRegex = /(https?:\/\/[\w\d_\-.]{1,256}(?:\/(?:\S*[\w:/#[\]@$&'()*+=])?)?(?![^?!,:;\w\s]\S))/g;
    text = reactStringReplace(text, linkRegex, (match, i) => (
        <a
            href={match}
            rel="noreferrer"
            target="_blank"
            key={match + i}
        >{match}</a>
    ));

    // Make @mentions clickable
    text = reactStringReplace(text, /@([\w-]+)/, (match, i) => (
        <a
            href={isDashProject ? `user#${match}` : `https://scratch.mit.edu/users/${match}/`}
            rel="noreferrer"
            target="_blank"
            key={match + i}
        >{`@${match}`}</a>
    ));

    if (isDashProject) return text;

    // Make hashtags clickable
    // TODO: Add projects search for Dash
    text = reactStringReplace(text, /#([\w-]+)/g, (match, i) => (
        <a
            href={`https://scratch.mit.edu/search/projects?q=${match}`}
            target="_blank"
            key={match + i}
            rel="noreferrer"
        >{`#${match}`}</a>
    ));

    return text;
};

export default decorate;
