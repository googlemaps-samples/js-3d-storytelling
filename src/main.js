import { initializeCesiumViewer } from "./utils/cesium.js";
import { addSidebarToggleHandler } from "./sidebar/sidebar.js";

async function main() {
  try {
    await initializeCesiumViewer();

    addSidebarToggleHandler();
  } catch (error) {
    console.error(error);
  }
}

main();
