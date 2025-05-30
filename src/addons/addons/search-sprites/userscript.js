export default async function ({ addon, console, msg }) {
  let spritesContainer;
  let spriteSelectorContainer;

  const container = document.createElement("div");
  container.className = "sa-search-sprites-container sa-search-sprites-empty";
  addon.tab.displayNoneWhileDisabled(container);

  const searchBox = document.createElement("input");
  searchBox.className = "sa-search-sprites-box";
  searchBox.placeholder = msg("placeholder");
  searchBox.autocomplete = "off";
  // search might make more sense, but browsers treat them special in ways that this addon does not handle,
  // so just leave it as a text input. Also note that Scratch uses type=text for its own search inputs in
  // the libraries, so this fits right in.
  searchBox.type = "text";

  const search = (query) => {
    if (!spritesContainer) return;

    query = query.toLowerCase();
    const containsQuery = (str) => str.toLowerCase().includes(query);

    for (const sprite of spritesContainer.children) {
      const visible =
        !query ||
        containsQuery(sprite.children[0].children[1].innerText) ||
        (containsQuery(sprite.children[0].children[2].children[0].innerText) &&
          sprite.children[0].classList.contains("sa-folders-folder"));
      sprite.style.display = visible ? "" : "none";
    }
  };

  searchBox.addEventListener("input", (e) => {
    container.classList.toggle("sa-search-sprites-empty", !e.target.value);
    search(e.target.value);
  });

  const searchIcon = document.createElement("img");
  searchIcon.className = "sa-search-sprites-icon";
  searchIcon.src = addon.self.getResource("/search-icon.svg") /* rewritten by pull.js */;
  searchIcon.alt = "";
  searchIcon.draggable = false;

  const reset = () => {
    search("");
    searchBox.value = "";
    container.classList.add("sa-search-sprites-empty");
  };

  const resetButton = document.createElement("button");
  resetButton.className = "sa-search-sprites-reset";
  resetButton.addEventListener("click", () => {
    reset();
    searchBox.focus();
  });
  addon.self.addEventListener("disabled", reset);

  const resetIcon = document.createElement("img");
  resetIcon.src = addon.self.getResource("/reset-icon.svg") /* rewritten by pull.js */;
  resetIcon.alt = msg("clear");
  resetIcon.draggable = false;
  resetButton.appendChild(resetIcon);

  container.appendChild(searchBox);
  container.appendChild(searchIcon);
  container.appendChild(resetButton);

  while (true) {
    await addon.tab.waitForElement("div[class^='sprite-selector_items-wrapper']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    spritesContainer = document.querySelector('[class^="sprite-selector_items-wrapper"]');
    spriteSelectorContainer = document.querySelector('[class^="sprite-selector_sprite-selector"]');
    const addButton = document.querySelector('[class*="sprite-selector_add-button"]');
    spriteSelectorContainer.insertBefore(container, addButton);
    reset(); // Clear search box after going outside then inside
  }
}
