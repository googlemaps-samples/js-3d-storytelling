import { initCesiumViewer } from "./utils/cesium.js";
import { loadConfig } from "./utils/config.js";
import createMarkers from "./utils/create-markers.js";
import { addChaptersBar } from "./chapters/chapters.js";
import { initGoogleMaps } from "./utils/places.js";
import { initChapterNavigation } from "./chapters/chapter-navigation.js";

/**
 * The story configuration object
 * @type {Story}
 */
export let story;

const isStoryInLocalStorage = Boolean(localStorage.getItem("story"));

/**
 * Here we load the configuration.
 *
 * The current implementation loads our local `config.json`.
 *
 * This can be changed easily, to fetch from any other API, CMS
 * or request some file from another host, by changing the config url parameter.
 *
 * You could also implement your (dynamic) configuration loading function here.
 */

// Check if story is in local storage
if (isStoryInLocalStorage) {
  story = JSON.parse(localStorage.getItem("story"));
} else {
  // If not load story config from local file
  story = await loadConfig("./config.json");
  localStorage.setItem("story", JSON.stringify(story));
}

const { chapters } = story;

/**
 * The main function. This function is called when the page is loaded.
 * It then initializes all necessary parts of the application.
 */
async function main() {
  try {
    await initCesiumViewer();
    await initGoogleMaps();

    // Create markers from chapter coordinates
    await createMarkers(chapters);

    addChaptersBar(story);
    initChapterNavigation();
  } catch (error) {
    console.error(error);
  }
}

main();
