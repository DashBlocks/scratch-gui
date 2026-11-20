import { isSelectTool, updateSelectTool } from "./updateSelectTool.js";
import { enable, disable, loadSettings, setGuideColor, toggle } from "./state.js";
import { initUI } from "./ui.js";
import { updateScaleTool } from "./updateScaleTool.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function (api) {
  const { addon } = api;
  addon.self.addEventListener("disabled", disable);
  addon.self.addEventListener("reenabled", enable);
  loadSettings(addon);
  const paper = await addon.tab.traps.getPaper();

  toggle(addon.settings.get("enable-default"));
  setGuideColor(addon.settings.get("guide-color"));
  addon.settings.addEventListener("change", () => setGuideColor(addon.settings.get("guide-color")));

  const updateTool = () => {
    const tool = paper.tool;
    if (!isSelectTool(tool)) return;
    updateSelectTool(paper, tool, addon.tab.traps.vm);
    updateScaleTool(paper, tool, addon.tab.traps.vm);
  };
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (event) => {
    if (event.detail.action.type === "scratch-paint/modes/CHANGE_MODE") {
      setTimeout(updateTool);
    }
  });
  updateTool();
  initUI(api);
}
