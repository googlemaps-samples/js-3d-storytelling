import { initCesiumViewer } from "./utils/cesium.js";
import { loadConfig } from "./utils/config.js";
import createMarkers from "./utils/create-markers.js";
import {
  addSidebarToggleHandler,
  initAutoComplete,
  updateSidebarLocationList,
  initDragAndDrop,
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
export let story;

const isStoryInLocalStorage = Boolean(localStorage.getItem("story"));

// Check if story is in local storage
if (isStoryInLocalStorage) {
  story = JSON.parse(localStorage.getItem("story"));
} else {
  story = await loadConfig("./config.json");
  localStorage.setItem("story", JSON.stringify(story));
}

const { chapters } = story;

async function main() {
  try {
    await initCesiumViewer();
    await initGoogleMaps();
    await initAutoComplete();
    updateSidebarLocationList(chapters);

    // Create markers from chapter coordinates using chapter title as marker id
    await createMarkers(
      story.chapters.map(({ coords, title }) => ({ coords, id: title }))
    );

    //initializeStory(story);

    addSidebarToggleHandler();
    initDragAndDrop();
    initChapterNavigation();
    addChaptersBar(story);
  } catch (error) {
    console.error(error);
  }
}

main();

export function updateUI(story) {
  // Update sidebar
  updateSidebarLocationList(story.chapters);
  // Update markers
  createMarkers(
    story.chapters.map(({ coords, title }) => ({ coords, id: title }))
  );
  // Update chapters bar
  addChaptersBar(story);
}
