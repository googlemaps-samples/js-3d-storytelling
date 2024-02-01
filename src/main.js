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
export const story = await loadConfig("./config.json");
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

await main();
