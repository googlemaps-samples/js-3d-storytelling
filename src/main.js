import { initializeCesiumViewer } from "./utils/cesium.js";
import { addSidebarToggleHandler } from "./sidebar/sidebar.js";
import { addChaptersBar } from "./chapters/chapters.js";

// TODO: get data from config
const story = {
  chapters: [
    {
      title: "Hello world",
      imageUrl: "https://picsum.photos/144/112",
      dateTime: "Jan 14 1967",
    },
    {
      title: "Lorem ipsum",
      imageUrl: "https://picsum.photos/144/112",
      dateTime: "Feb 24 – 27 1967",
    },
    {
      title: "Dolor sit amet",
      imageUrl: "https://picsum.photos/144/112",
      dateTime: "Spring 1967",
    },
  ],
  properties: {
    title: "1967 My Story Title",
    imageUrl: "https://picsum.photos/144/112",
  },
};

async function main() {
  try {
    await initializeCesiumViewer();

    addSidebarToggleHandler();
    addChaptersBar(story);
  } catch (error) {
    console.error(error);
  }
}

main();
