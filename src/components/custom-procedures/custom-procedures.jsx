import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import LazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks';
import {blockColors} from '../../lib/themes/blocks/three';

import booleanInputIcon from './icon--boolean-input.svg';
import textInputIcon from './icon--text-input.svg';
import labelIcon from './icon--label.svg';

import styles from './custom-procedures.css';

const messages = defineMessages({
    myblockModalTitle: {
        defaultMessage: 'Make a Block',
        description: 'Title for the modal where you create a custom block.',
        id: 'gui.customProcedures.myblockModalTitle'
    }
});

const CustomProcedures = (props) => {
    const ScratchBlocks = LazyScratchBlocks.get();
    const themeObj = props.theme.getCustomExtensionColors();
    const categories = [
        "motion",
        "looks",
        "sounds",
        "event",
        "control",
        "sensing",
        "operators",
        "data",
        "data_lists",
        "json",
        "more",
        "pen",
    ];
    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.intl.formatMessage(messages.myblockModalTitle)}
            onRequestClose={props.onCancel}
            id="customProceduresModal"
        >
            <Box
                className={styles.workspace}
                componentRef={props.componentRef}
            />
            <Box className={styles.body}>
                <div className={styles.optionsRow}>
                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddTextNumber}
                    >
                        <img
                            className={styles.optionIcon}
                            src={textInputIcon}
                            draggable={false}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Add an input"
                                description="Label for button to add a number/text input"
                                id="gui.customProcedures.addAnInputNumberText"
                            />
                        </div>
                        <div className={styles.optionDescription}>
                            <FormattedMessage
                                defaultMessage="number or text"
                                description="Description of the number/text input type"
                                id="gui.customProcedures.numberTextType"
                            />
                        </div>
                    </div>
                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddBoolean}
                    >
                        <img
                            className={styles.optionIcon}
                            src={booleanInputIcon}
                            draggable={false}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Add an input"
                                description="Label for button to add a boolean input"
                                id="gui.customProcedures.addAnInputBoolean"
                            />
                        </div>
                        <div className={styles.optionDescription}>
                            <FormattedMessage
                                defaultMessage="boolean"
                                description="Description of the boolean input type"
                                id="gui.customProcedures.booleanType"
                            />
                        </div>
                    </div>
                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddLabel}
                    >
                        <img
                            className={styles.optionIcon}
                            src={labelIcon}
                            draggable={false}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Add a label"
                                description="Label for button to add a label"
                                id="gui.customProcedures.addALabel"
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.colorRow}>
                    {categories.map((category, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: ScratchBlocks.Colours[category].primary,
                            }}
                            className={styles.colorOption}
                            role="button"
                            draggable={false}
                            onClick={() => props.setColor(blockColors[category].primary)}
                        />
                    ))}
                    <input
                        style={{
                            backgroundColor: Object.keys(themeObj).length === 0
                                ? props.color ?? blockColors.more.primary
                                : themeObj.primary(props.color ?? blockColors.more.primary),
                        }}
                        type="color"
                        value={props.color ?? blockColors.more.primary}
                        className={classNames(styles.colorOption, styles.colorPicker)}
                        onChange={(e) => props.setColor(e.target.value)}
                    />
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            checked={props.warp}
                            type="checkbox"
                            onChange={props.onToggleWarp}
                        />
                        <FormattedMessage
                            defaultMessage="Run without screen refresh"
                            description="Label for checkbox to run without screen refresh"
                            id="gui.customProcedures.runWithoutScreenRefresh"
                        />
                    </label>
                </div>
                <Box className={styles.buttonRow}>
                    <button
                        className={styles.cancelButton}
                        onClick={props.onCancel}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel"
                            description="Label for button to cancel custom procedure edits"
                            id="gui.customProcedures.cancel"
                        />
                    </button>
                    <button className={styles.okButton} onClick={props.onOk}>
                        <FormattedMessage
                            defaultMessage="OK"
                            description="Label for button to save new custom procedure"
                            id="gui.customProcedures.ok"
                        />
                    </button>
                </Box>
            </Box>
        </Modal>
    );
};
            
CustomProcedures.propTypes = {
    componentRef: PropTypes.func.isRequired,
    intl: intlShape,
    onAddBoolean: PropTypes.func.isRequired,
    onAddLabel: PropTypes.func.isRequired,
    onAddTextNumber: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    onToggleWarp: PropTypes.func.isRequired,
    warp: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

export default injectIntl(connect(
    mapStateToProps
)(CustomProcedures));
