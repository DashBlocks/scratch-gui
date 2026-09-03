import Cast from "scratch-vm/src/util/cast";

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
  ScratchBlocks.WorkspaceSvg.prototype.reportValue = function (id, value, options) {
    let block = this.getBlockById(id);
    if (!block) {
      throw "Tried to report value on block that does not exist.";
    }

    const valueIsComplicated = (
      Cast.isCustomType(value) ||
      Cast.isNormalArray(value) ||
      Cast.isNormalObject(value) ||
      value instanceof Error
    );
      
    ScratchBlocks.DropDownDiv.hideWithoutAnimation();
    ScratchBlocks.DropDownDiv.clearContent();

    const contentDiv = ScratchBlocks.DropDownDiv.getContentDiv();

    const valueReportBox = document.createElement("div");
    valueReportBox.setAttribute("class", "valueReportBox");
    if (valueIsComplicated) {
      if (typeof value.toReporterContent === 'function') {
        valueReportBox.appendChild(value.toReporterContent());
      } else if (value instanceof Error) {
        valueReportBox.textContent = value.stack;
      } else {
        const placeholder = document.createElement('i');
        placeholder.textContent = '*custom type*';
        valueReportBox.appendChild(placeholder);
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

      if (value !== "" && !valueIsComplicated) {
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
      options?.isUncaught ? ScratchBlocks.Colours.valueReportUncaughtBorder : ScratchBlocks.Colours.valueReportBorder
    );
    ScratchBlocks.DropDownDiv.showPositionedByBlock(this, block);
  };
}
