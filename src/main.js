import { initCesiumViewer } from "./utils/cesium.js";
import { loadConfig } from "./utils/config.js";
import createMarkers from "./utils/create-markers.js";
import {
  addSidebarToggleHandler,
  initAutoComplete,
  updateSidebar,
  initDragAndDrop,
} from "./sidebar/sidebar.js";
import { addChaptersBar } from "./chapters/chapters.js";
import { initGoogleMaps } from "./utils/places.js";
import {
  initChapterNavigation,
  updateChapterContent,
} from "./chapters/chapter-navigation.js";

// Here we load the configuration.
// The current implementation loads our local `config.json`.
//
// This can be changed easily, to fetch from any other API, CMS
// or request some file from another host, by changing the config url parameter.
//
// You could also implement your (dynamic) configuration loading function here.
// Create a handler for the proxy

/**
 * Proxy handler for handling get, set and delete operations on story proxy object.
 * @type {ProxyHandler}
 */
const storyProxyHandler = {
  /**
   * Retrieves the value of a property from the target object.
   * If the value is an object, it creates a new Proxy for that object.
   * @param {Object} target - The target object.
   * @param {string} key - The key of the property to retrieve.
   */
  get(target, key) {
    const value = target[key];
    if (typeof value === "object" && value !== null) {
      return new Proxy(value, storyProxyHandler);
    }
    return value;
  },

  /**
   * Sets the updated value of a property on the target object.
   * @param {Object} target - The target object.
   * @param {string} property - The key to set the value for.
   * @returns {boolean} - Returns true if the value was successfully set.
   */
  set(target, property, updatedValue) {
    // Update the value
    target[property] = updatedValue;

    // Get cards container
    const cardsContainer = document.querySelector("#chapters-bar .cards");

    // Check if the property is the chapters array
    if (property === "properties") {
      // Update chapter details
      updateChapterContent(target.properties, target, true);

      // Update the intro card
      const card = cardsContainer.querySelector(`.story-intro`);

      // Update headline in intro-card
      const headline = card.querySelector("h1");

      headline.textContent = updatedValue.title;
    } else {
      // Update chapter card

      // Get card to be updated
      const card = cardsContainer.querySelector(`.card[id="${target.id}"]`);

      // Get element to be updated
      const element =
        card.querySelector(`[data-input-name="${property}"]`) || null;

      // Update element

      // Check if element is an image
      // If so, update the src attribute
      // Otherwise, update the text content
      if (property === "imageUrl") {
        element.src = updatedValue;
      } else {
        element.textContent = updatedValue;
      }

      // Beside the card, we also need to update the location list item
      // Get location list item
      const locationListItem = document.querySelector(
        `.location-list-item[id="${target.id}"]`
      );

      const locationListItemParagraph = locationListItem.querySelector("p");

      locationListItemParagraph.textContent = updatedValue;
    }

    return true;
  },

  /**
   * Deletes a property from the chapter object and updates the UI accordingly.
   *
   * @param {Array} chapters - The chapter object from which the property will be deleted.
   * @param {string} deletedChapterId - The id of the property to be deleted.
   * @returns {boolean} - Returns true if the property was successfully deleted.
   */
  deleteProperty(chapters, deletedChapterId) {
    // Find index of chapter to be deleted
    const deletedChapterIndex = chapters.findIndex(
      (chapter) => Number(chapter.id) === Number(deletedChapterId)
    );

    // Remove chapter from story
    chapters.splice(deletedChapterIndex, 1);

    // We need to update the UI
    // Instead of re-rendering the whole UI, we can just remove the deleted chapter from the location list and chapters bar

    // Remove chapter from location list
    const locationListContainer = document.querySelector(".location-list");

    const locationListItem = locationListContainer.querySelector(
      `.location-list-item[id="${deletedChapterId}"]`
    );

    locationListContainer.removeChild(locationListItem);

    // Remove chapter from chapters bar
    const cardsContainer = document.querySelector("#chapters-bar .cards");

    const chapterCard = cardsContainer.querySelector(
      `.chapter-card[id="${deletedChapterId}"]`
    );

    cardsContainer.removeChild(chapterCard);

    return true;
  },
};

let story;

const isStoryInLocalStorage = Boolean(localStorage.getItem("story"));

// Check if story is in local storage
if (isStoryInLocalStorage) {
  story = JSON.parse(localStorage.getItem("story"));
} else {
  story = await loadConfig("./config.json");
  localStorage.setItem("story", JSON.stringify(story));
}

/**
 * Creates a proxy object for the story object.
 * This allows us to intercept these operations and update the UI accordingly without having to re-render the whole UI.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
 * @type {Proxy}
 */
export let storyProxy = new Proxy(story, storyProxyHandler);

const { properties } = storyProxy;

async function main() {
  try {
    await initCesiumViewer(properties);
    await initGoogleMaps();
    await initAutoComplete();
    updateSidebar(storyProxy);

    // Create markers from chapter coordinates using chapter title as marker id
    await createMarkers(
      storyProxy.chapters.map(({ coords, title }) => ({ coords, id: title }))
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

export function updateUI() {
  // Update sidebar
  updateSidebar(storyProxy);
  // Update markers
  createMarkers(
    storyProxy.chapters.map(({ coords, title }) => ({ coords, id: title }))
  );
  // Update chapters bar
  addChaptersBar(storyProxy);
}
