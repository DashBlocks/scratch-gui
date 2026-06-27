import React from 'react';
import bindAll from 'lodash.bindall';
import {APP_NAME} from '../../lib/brand';
import {isScratchDesktop} from '../../lib/isScratchDesktop';
import CloseButton from '../close-button/close-button.jsx';
import styles from './tw-news.css';
import {isNewYearMode} from '../dash-new-year-mode/new-year-mode.jsx';

const getIsClosedInLocalStorage = (key, id) => {
    try {
        return localStorage.getItem(key) === id;
    } catch (e) {
        return false;
    }
};

const markAsClosedInLocalStorage = (key, id) => {
    try {
        localStorage.setItem(key, id);
    } catch (e) {
        // ignore
    }
};

class TWNews extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose'
        ]);
        this.state = {
            closed: getIsClosedInLocalStorage(props.item, props.id)
        };
    }
    handleClose () {
        markAsClosedInLocalStorage(this.props.item, this.props.id);
        this.setState({
            closed: true
        }, () => {
            window.dispatchEvent(new Event('resize'));
        });
    }
    render () {
        if (this.state.closed || isScratchDesktop()) {
            return null;
        }
        return (
            <>
                {this.props.id == 'new-compiler' && (<div className={styles.news}>
                    <div className={styles.text}>
                        {/* eslint-disable-next-line max-len */}
                        {`We rewrote the ${APP_NAME} compiler to make projects run even faster. Bugs are possible. `}
                        <a
                            href="https://dashblocks.org/docs/new-compiler"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {'Learn more.'}
                        </a>
                        {' '}
                        <a
                            href="https://dashblocks.org/old-compiler"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {'Old compiler.'}
                        </a>
                    </div>
                    <CloseButton
                        className={styles.close}
                        onClick={this.handleClose}
                    />
                </div>)}
                {this.props.id == 'dev-version' && (<div className={styles.news}>
                    <div className={styles.text}>
                        {/* eslint-disable-next-line max-len */}
                        {`This is a "Dev" version of ${APP_NAME}. Please do not use this version for real projects, as it may break your projects! `}
                        <a
                            href="https://dashblocks.org"
                            rel="noreferrer"
                        >
                            {'Main version.'}
                        </a>
                    </div>
                    <CloseButton
                        className={styles.close}
                        onClick={this.handleClose}
                    />
                </div>)}
                {this.props.id == 'new-year' && (<div className={styles.news}>
                    <div className={styles.text}>
                        {/* eslint-disable-next-line max-len */}
                        {`Happy New Year! Enjoy the festive theme while it lasts. `}
                        <a
                            href={isNewYearMode() ? 'https://dashblocks.org' : 'https://dashblocks.org/?newYearMode'}
                            rel="noreferrer"
                        >
                            {isNewYearMode() ? 'Switch to normal mode.' : 'Switch to new year mode.'}
                        </a>
                    </div>
                    <CloseButton
                        className={styles.close}
                        onClick={this.handleClose}
                    />
                </div>)}
                {this.props.id == 'donate' && (<div className={styles.news}>
                    <div className={styles.text}>
                        {/* eslint-disable-next-line max-len */}
                        {`Support development, help us host community, and get exclusive benefits by `}
                        <a
                            href="donate"
                            rel="noreferrer"
                        >
                            {'donating us'}
                        </a>
                        {'!'}
                    </div>
                    <CloseButton
                        className={styles.close}
                        onClick={this.handleClose}
                    />
                </div>)}
            </>
        );
    }
}

export default TWNews;
