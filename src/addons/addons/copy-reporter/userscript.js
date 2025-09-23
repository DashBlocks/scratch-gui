export default async function ({ addon, console, msg }) {
  addon.tab.createEditorContextMenu(
    (ctx) => {
      const className = ctx.type === "monitor_large" ? "monitor_large-value" : "monitor_value";
      const element = ctx.target.querySelector(`[class*='${className}_']`);

      if (element.innerText.length !== 0) {
        navigator.clipboard.writeText(element.innerText);
      }
    },
    {
      className: "copy",
      types: ["monitor_default", "monitor_large", "monitor_slider"],
      position: "monitor",
      order: 0,
      label: msg("copy-value"),
    }
  );

  // add button to reporter bubble
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/workspace_svg.js#L979
  ScratchBlocks.WorkspaceSvg.prototype.reportValue = function (id, value) {
    let block = this.getBlockById(id);
    if (!block) {
      throw "Tried to report value on block that does not exist.";
    }

    ScratchBlocks.DropDownDiv.hideWithoutAnimation();
    ScratchBlocks.DropDownDiv.clearContent();

    let contentDiv = ScratchBlocks.DropDownDiv.getContentDiv();

    let valueReportBox = document.createElement("div");
    valueReportBox.setAttribute("class", "valueReportBox");
    const maxShownItems = 50;
    if (Array.isArray(value)) {
      const more = value.length - maxShownItems;
      const result = value.length === 0 ? '[]' : value.slice(0, maxShownItems).reduce(function(acc, value, i, array) {
        acc += i === 0 ? '[' : '';
        acc += Array.isArray(value)
          ? 'nested array'
          : typeof value === 'object' && value !== null
            ? 'nested object'
            : JSON.stringify(value);
        acc += i === array.length - 1 ? (more > 0 ? ', *' + more + ' more items*' : '') + ']' : ', ';
        return acc;
      }, '');
      valueReportBox.textContent = result;
    } else if (typeof value === 'object' && value !== null) {
      if (
        value?.constructor?.prototype !== Object.prototype &&
        typeof value.customId === 'string' && typeof value.toReporterContent === 'function'
      ) {
        valueReportBox.appendChild(value.toReporterContent());
      } else {
        const more = Object.keys(value).length - maxShownItems;
        const result = Object.keys(value).length === 0 ? '{}' : Object.entries(value).slice(0, 50).reduce(function(acc, value, i, array) {
          acc += i === 0 ? '{' : '';
          acc += JSON.stringify(value[0]) + ': ';
          acc += Array.isArray(value[1])
            ? 'nested array'
            : typeof value[1] === 'object' && value[1] !== null
              ? 'nested object'
              : JSON.stringify(value[1]);
          acc += i === array.length - 1 ? (more > 0 ? ', *' + more + ' more items*' : '') + '}' : ', ';
          return acc;
        }, '');
        valueReportBox.textContent = result;
      }
    } else {
      valueReportBox.textContent = String(value);
    }

    if (!addon.self.disabled) {
      // use to get focus and event priority
      valueReportBox.setAttribute("tabindex", "0");
      // if the user pressed Ctrl+C, prevent propagation to Blockly
      valueReportBox.onkeydown = (event) => {
        if ((event.altKey || event.ctrlKey || event.metaKey) && event.code === "KeyC") {
          event.stopPropagation();
        }
      };

      if (value !== "" && !(typeof value === 'object' && value instanceof Object)) {
        const copyButton = document.createElement("img");
        copyButton.setAttribute("role", "button");
        copyButton.setAttribute("tabindex", "0");
        copyButton.setAttribute("alt", msg("copy-to-clipboard"));
        copyButton.setAttribute("src", addon.self.getResource("/copy.svg")) /* rewritten by pull.js */;

        copyButton.classList.add("sa-copy-reporter-icon");
        addon.tab.displayNoneWhileDisabled(copyButton);

        copyButton.onclick = () => navigator.clipboard.writeText(String(value));
        valueReportBox.appendChild(copyButton);
      }
    }

    contentDiv.appendChild(valueReportBox);

    ScratchBlocks.DropDownDiv.setColour(
      ScratchBlocks.Colours.valueReportBackground,
      ScratchBlocks.Colours.valueReportBorder
    );
    ScratchBlocks.DropDownDiv.showPositionedByBlock(this, block);
  };
}
