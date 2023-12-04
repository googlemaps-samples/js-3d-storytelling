import { initializeCesiumViewer } from "./utils/cesium.js";
import { loadConfig } from "./utils/config.js";
import { addSidebarToggleHandler } from "./sidebar/sidebar.js";
import { addChaptersBar } from "./chapters/chapters.js";

// Here we load the configuration.
// The current implementation loads our local `config.json`.
//
// This can be changed easily, to fetch from any other API, CMS
// or request some file from another host, by changing the config url parameter.
//
// You could also implement your (dynamic) configuration loading function here.
export const story = await loadConfig("config.json");

async function main() {
  try {
    await initializeCesiumViewer();

    //    initializeStory(story);

    addSidebarToggleHandler();
    addChaptersBar(story);
  } catch (error) {
    console.error(error);
  }
}

main();
