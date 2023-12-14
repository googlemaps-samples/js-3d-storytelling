import { initCesiumViewer } from "./utils/cesium.js";
import { loadConfig, storyProxyHandler } from "./utils/config.js";
import createMarkers from "./utils/create-markers.js";
import {
  addSidebarToggleHandler,
  initAutoComplete,
  updateSidebar,
  initDragAndDrop,
  addDownloadConfigHandler,
} from "./sidebar/sidebar.js";
import { addChaptersBar } from "./chapters/chapters.js";
import { initGoogleMaps } from "./utils/places.js";
import { initChapterNavigation } from "./chapters/chapter-navigation.js";

// Here we load the configuration.
// The current implementation loads our local `config.json`.
//
// This can be changed easily, to fetch from any other API, CMS
// or request some file from another host, by changing the config url parameter.
//
// You could also implement your (dynamic) configuration loading function here.
/**
 * The story configuration object
 * @type {Story}
 */
let storyConfig;

const isStoryInLocalStorage = Boolean(localStorage.getItem("story"));

// Check if story is in local storage
if (isStoryInLocalStorage) {
  storyConfig = JSON.parse(localStorage.getItem("story"));
} else {
  storyConfig = await loadConfig("./config.json");
  localStorage.setItem("story", JSON.stringify(storyConfig));
}

/**
 * Creates a proxy object for the story object.
 * This allows us to intercept these operations and update the UI accordingly without having to re-render the whole UI.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
 * @type {Story}
 */
export let story = new Proxy(storyConfig, storyProxyHandler);

const { chapters } = story;

async function main() {
  try {
    await initCesiumViewer();
    await initGoogleMaps();
    await initAutoComplete();
    updateSidebar(story);

    // Create markers from chapter coordinates
    await createMarkers(chapters);

    //initializeStory(story);

    addSidebarToggleHandler();
    initDragAndDrop();
    initChapterNavigation();
    addChaptersBar(storyConfig);
    addDownloadConfigHandler();
  } catch (error) {
    console.error(error);
  }
}

main();
