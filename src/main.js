import { initCesiumViewer } from "./utils/cesium.js";
import { loadConfig } from "./utils/config.js";
import createMarkers from "./utils/create-markers.js";
import {
  addSidebarToggleHandler,
  initAutoComplete,
  updatePlaces,
  initDraggableTiles,
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
export const story = await loadConfig("config.json");

const { chapters, properties } = story;

async function main() {
  try {
    await initCesiumViewer(properties);
    await initGoogleMaps();
    await initAutoComplete();
    updatePlaces(chapters);

    // Create markers from chapter coordinates using chapter title as marker id
    await createMarkers(
      story.chapters.map(({ coords, title }) => ({ coords, id: title }))
    );

    //initializeStory(story);

    addSidebarToggleHandler();
    initDraggableTiles(story);
    initChapterNavigation(story);
    addChaptersBar(story);
  } catch (error) {
    console.error(error);
  }
}

main();
