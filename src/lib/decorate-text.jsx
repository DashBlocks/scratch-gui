// https://github.com/LLK/scratch-www/blob/25232a06bcceeaddec8fcb24fb63a44d870cf1cf/src/lib/decorate-text.jsx

import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import * as styles from './decorate-text.css';
import reactStringReplace from 'react-string-replace';

import dashyEmoji from '../../static/images/emojis/dashy.png';
import fireEmoji from '../../static/images/emojis/fire.png';
import dEmoji from '../../static/images/emojis/d.png';

const Emoji = ({code}) => {
    const [missing, setMissing] = useState(false);
    const token = `:${code}:`;
    const showCode = useCallback(() => setMissing(true), []);
    return missing ? token : (
        <img
            alt={token}
            className={styles.emoji}
            draggable={false}
            src={
                    code === "dashy" ? dashyEmoji : (
                        code === "fire" ? fireEmoji : (
                            code === "d" ? dEmoji : "e"
                        )
                    )
            }
            onError={showCode}
        />
    );
};

Emoji.propTypes = {
    code: PropTypes.string.isRequired
};

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

    // Make #hashtags clickable
    text = reactStringReplace(text, /#([\w-]+)/g, (match, i) => (
        <a
            href={isDashProject ? `search?q=${match}` : `https://scratch.mit.edu/search/projects?q=${match}`}
            target="_blank"
            key={match + i}
            rel="noreferrer"
        >{`#${match}`}</a>
    ));

    // Make :emojis: appear
    let emojiIndex = 0;
    return reactStringReplace(text, /:(dashy|fire|d):/g, code => (
        <Emoji
            code={code}
            key={`emoji-${code}-${emojiIndex++}`}
        />
    ));
};

export default decorate;
