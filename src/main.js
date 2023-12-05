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

// Here we load the configuration.
// The current implementation loads our local `config.json`.
//
// This can be changed easily, to fetch from any other API, CMS
// or request some file from another host, by changing the config url parameter.
//
// You could also implement your (dynamic) configuration loading function here.
export const story = await loadConfig("config.json");

const { chapters } = story;

async function main() {
  try {
    await initCesiumViewer();
    await initGoogleMaps();
    await initAutoComplete();
    updatePlaces(chapters);

    await createMarkers(
      config.chapters.map(({ coords, title }) => ({ coords, id: title }))
    );

    //    initializeStory(story);

    addSidebarToggleHandler();
    initDraggableTiles();
    addChaptersBar(story);
  } catch (error) {
    console.error(error);
  }
}

main();
