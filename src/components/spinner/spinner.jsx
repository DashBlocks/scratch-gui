import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import lazyMessages from '../loader/lazy-messages.json';

import styles from './spinner.css';

const SpinnerComponent = function (props) {
    const {
        intl,
        className,
        level,
        small,
        large
    } = props;
    function chooseRandomMessage () {
        let messageNumber;
        const sum = lazyMessages.en.reduce(acc => acc + 1, 0);
        let rand = sum * Math.random();
        for (let i = 0; i < lazyMessages.en.length; i++) {
            rand -= 1;
            if (rand <= 0) {
                messageNumber = i;
                break;
            }
        }
        return messageNumber;
    }
    const [messageNumber, setMessageNumber] = useState(chooseRandomMessage());
    useEffect(() => {
        if (!props.showLazyMessages) return;
        
        const interval = setInterval(() => {
            setMessageNumber(chooseRandomMessage());
        }, 3000);

        return () => clearInterval(interval);
    }, []);
    return (
        <div className={styles.spinnerContainer}>
            <div
                className={classNames(
                    className,
                    styles.spinner,
                    styles[level],
                    {
                        [styles.small]: small,
                        [styles.large]: large
                    }
                )}
            />

            {props.showLazyMessages && (
                <div className={styles.messageContainerOuter}>
                    <div
                        className={styles.messageContainerInner}
                        style={{transform: `translate(0, -${messageNumber * 25}px)`}}
                    >
                        {intl?.locale === 'ru' ? lazyMessages.ru.map((m, i) => (
                            <div
                                className={styles.message}
                                key={i}
                            >
                                {m}
                            </div>
                        )) : lazyMessages.en.map((m, i) => (
                            <div
                                className={styles.message}
                                key={i}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
SpinnerComponent.propTypes = {
    intl: intlShape,
    className: PropTypes.string,
    large: PropTypes.bool,
    level: PropTypes.string,
    showLazyMessages: PropTypes.bool,
    small: PropTypes.bool
};
SpinnerComponent.defaultProps = {
    className: '',
    large: false,
    level: 'info',
    small: false
};
export default injectIntl(SpinnerComponent);
