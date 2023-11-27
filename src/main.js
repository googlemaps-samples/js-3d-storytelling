import { initializeCesiumViewer } from "./utils/cesium.js";

async function main() {
  try {
    await initializeCesiumViewer();
  } catch (error) {
    console.error(error);
  }
}

main();
