import { story } from "../main.js";
import {
  createLocationItem,
  initDragAndDrop,
  createEditMenus,
} from "../sidebar/sidebar.js";
import { createChapterCard } from "../chapters/chapters.js";
import {
  resetToIntro,
  updateChapterContent,
  updateDetailsNavigation,
} from "../chapters/chapter-navigation.js";
import {
  createCustomRadiusShader,
  removeCustomRadiusShader,
} from "../utils/cesium.js";

import {
  createMarkers,
  hideMarker,
  showMarker,
  removeMarker,
} from "./create-markers.js";

// Properties of a chapter that can be edited
const chapterProperties = [
  "title",
  "content",
  "address",
  "media",
  "dateTime",
  "mediaCredit",
  "showFocus",
  "radius",
  "showLocationMarker",
  "cameraOptions",
];

/**
 * Asynchronously fetches and loads a configuration file in JSON format.
 *
 * If successful, the configuration data is returned for use in the application.
 * The returned configuration object is deep-frozen to prevent modifications.
 *
 * If an error occurs during the fetch or parsing, an error message is thrown.
 *
 * @param {string} configUrl - The URL of the configuration file to be fetched.
 * @returns {Object} A Promise that resolves with the loaded and parsed configuration data.
 *
 * @throws {string} If an error occurs during the fetch or parsing, a descriptive error message is thrown.
 *
 * @example
 * const configUrl = "path/to/config.json";
 * try {
 *   const configData = await loadConfig(configUrl);
 *   console.log('Configuration loaded successfully:', configData);
 * } catch (error) {
 *   console.error('Error loading config:', error);
 * }
 */
export async function loadConfig(configUrl) {
  try {
    // Fetch the configuration data from the specified URL.
    const configResponse = await fetch(configUrl);
    // Parse the JSON data
    const configData = await configResponse.json();

    return configData;
  } catch (error) {
    // Handle and report any errors during the process.
    throw `Failed to load and parse configuration data: ${error}`;
  }
}

/**
 * Adds a new story chapter and saves it to local storage.
 * @param {Chapter} chapter - The chapter object to be added.
 * @returns {void}
 */
export function addChapterToStory(chapter) {
  const chapterIds = story.chapters.map(({ id }) => id).filter(Boolean);

  // Increment hightest existing chapter id by one. If no chapters exist, set id to 0
  const newChapterId = chapterIds.length ? Math.max(...chapterIds) + 1 : 0;

  // If not specified, the new chapter will have a marker and no focus by default
  const newChapter = {
    focusOptions: {
      focusRadius: null,
      showFocus: false,
      showLocationMarker: true,
    },
    ...chapter,
    id: newChapterId,
  };

  // Add new chapter to story
  story.chapters.push(newChapter);

  // Create chapter marker and add it to the map
  createMarkers([newChapter]);

  // Update details navigation
  updateDetailsNavigation();

  // Save updated object back to local storage
  localStorage.setItem("story", JSON.stringify(story));
}

/**
 * Returns the updated chapter data from the edit chapter form.
 */
export const getChapterDetails = () => {
  const locationConfigForm = document.querySelector(
    'form[name="edit-chapter-form"]'
  );
  return getFormData(locationConfigForm);
};

/**
 * Returns the updated chapter data from the edit chapter form.
 */
export const getStoryDetails = () => {
  const storyDetailsForm = document.querySelector(
    'form[name="story-details-form"]'
  );
  return getFormData(storyDetailsForm);
};
/**
 * Returns the data of an HTML form element in form of an object.
 *
 * @param {HTMLFormElement} form - The HTML form element to get the data from.
 * @returns {Object} The form data as object.
 */
const getFormData = (form) => {
  const formData = new FormData(form);

  return Array.from(formData.keys()).reduce((result, key) => {
    const inputType = form.querySelector(`input[name="${key}"]`).type;
    // Handle numeric input values
    const isNumericValue = inputType === "number" || inputType === "range";
    const value = isNumericValue
      ? Number(formData.get(key))
      : formData.get(key);

    if (key.includes(".")) {
      // Handle object data with dot-separated keys
      // e.g. "my.nested.keys" results in {my: {nested: {keys: ...}}}
      const [objectKey, ...nestedKeys] = key.split(".");

      const setNestedProperty = (object, properties, value) => {
        const [property, ...nestedProperties] = properties;
        return {
          ...object,
          [property]: nestedProperties.length
            ? setNestedProperty(nestedProperties, value)
            : value,
        };
      };

      result[objectKey] = setNestedProperty(
        result[objectKey] || {},
        nestedKeys,
        value
      );
    } else if (result[key]) {
      // Combine the values of inputs with the same name as array
      result[key] = formData.getAll(key);
    } else {
      result[key] = value;
    }

    return result;
  }, {});
};

/**
 * Proxy handler for handling get, set and delete operations on story object.
 * @type {ProxyHandler}
 */
export const storyProxyHandler = {
  /**
   * Retrieves the value of a property from the target object.
   * If the value is an object, it creates a new Proxy for that object.
   * @param {Object} target - The target object.
   * @param {string} key - The key of the property to retrieve.
   */
  get(target, key) {
    const value = target[key];
    if (typeof value === "object" && value !== null) {
      return new Proxy(value, {
        ...storyProxyHandler,
        parent: target, // Pass the parent object to the proxy handler as a property (used to access the parent object in the set handler)
      });
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
    // Check if the property being is the length property
    // If so, return true to ignore changes to the length property (for example when adding a new chapter)

    if (property === "length") {
      return true;
    }

    if (Array.isArray(target)) {
      const isNewChapter = !target.includes(updatedValue.id);

      if (isNewChapter) {
        // Add new chapter to story
        target.push(updatedValue);

        // Add card elements to the bar container
        const cardsContainer = document.querySelector(".cards");

        const chapterCard = createChapterCard(updatedValue);
        cardsContainer.appendChild(chapterCard);

        // Add new location tile to the location list
        const locationListContainer = document.querySelector(".location-list");
        locationListContainer.append(createLocationItem(updatedValue));

        // Todo: Refactor initDragAndDrop and createEditMenus to be called only once
        // Initialize drag and drop with new chapter tile
        initDragAndDrop();

        // Create edit menus
        createEditMenus();
        return true;
      }
    }

    // Check if changed property is a chapter property
    if (chapterProperties.includes(property)) {
      if (property === "radius") {
        const radius = updatedValue;
        const coords = target.coords;
        createCustomRadiusShader(coords, radius);
        target.focusOptions.focusRadius = radius;
        return true;
      }

      if (property === "showFocus") {
        const showFocus = updatedValue;

        if (showFocus === true) {
          const radius = target.focusRadius;
          const coords = this.parent.coords; // Get the parent object (chapter) and access its coords property

          createCustomRadiusShader(coords, radius || undefined);
        } else {
          removeCustomRadiusShader();
        }
        target.showFocus = showFocus;
        return true;
      }

      if (property === "showLocationMarker") {
        const showLocationMarker = updatedValue;
        const markerId = this.parent.id; // Get the parent object (chapter) and access its id property

        if (showLocationMarker) {
          showMarker(markerId);
        } else {
          hideMarker(markerId);
        }

        target.showLocationMarker = showLocationMarker;

        return true;
      }
      // Update the value
      target[property] = updatedValue;

      // Update chapter card
      updateChapterCard(target, property, updatedValue);

      // Update chapter details
      updateChapterContent(target, false);

      // Update location list item
      if (property === "title") {
        updateLocationListItem(target.id, updatedValue);
      }
    }

    // Update the value
    target[property] = updatedValue;

    // Check if changed property is the chapters array
    // If so, we return here because we updated the chapter order after drag and drop
    if (property === "chapters") {
      return true;
    }

    if (property === "properties") {
      // Update chapter details

      // getMediaUrl(target.properties);

      updateChapterContent(target.properties, true);

      updateStoryCard(target.properties);
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
    deleteLocationListItem(deletedChapterId);

    // Remove chapter from chapters bar
    deleteChapterCard(deletedChapterId);

    // Remove chapter marker from map
    removeMarker(deletedChapterId);

    // Update details navigation
    updateDetailsNavigation();

    resetToIntro();

    return true;
  },
};

/**
 * Deletes a chapter card from the DOM.
 *
 * @param {string} deletedChapterId - The ID of the chapter card to be deleted.
 */
function deleteChapterCard(deletedChapterId) {
  // Get cards container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Get card to be deleted
  const card = cardsContainer.querySelector(`.card[id="${deletedChapterId}"]`);

  // Remove card
  cardsContainer.removeChild(card);
}

/**
 * Deletes a location list item from the DOM.
 *
 * @param {string} deletedChapterId - The ID of the chapter to be deleted.
 */
function deleteLocationListItem(deletedChapterId) {
  // Get location list container
  const locationListContainer = document.querySelector(".location-list");

  // Get location list item to be deleted
  const locationListItem = locationListContainer.querySelector(
    `.location-list-item[id="${deletedChapterId}"]`
  );

  // Remove location list item
  locationListContainer.removeChild(locationListItem);
}

/**
 * Updates the chapter card with the specified target, property, and updated value.
 * @param {HTMLElement} target - The target element.
 * @param {string} property - The property to be updated.
 * @param {string} updatedValue - The updated value.
 */
function updateChapterCard(target, property, updatedValue) {
  // Get cards container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Get card to be updated
  const card = cardsContainer.querySelector(`.card[id="${target.id}"]`);

  if (!card) {
    console.warn(`Chapter card with id ${target.id} not found`);
    return;
  }

  // Get element to be updated
  const element = card.querySelector(`[data-input-name="${property}"]`) || null;

  if (!element) {
    console.warn(`Element with data-input-name "${property}" not found`);
    return;
  }

  // Update element

  // Check which property of chapter card is being updated
  if (property === "media") {
    element.src = updatedValue.previewUrl;
  }

  if (property === "title") {
    element.textContent = updatedValue;
  }
}

/**
 * Updates the value of a location list item.
 *
 * @param {string} targetId - The target location list item id to be updated.
 * @param {string} updatedValue - The updated value to be set.
 */
function updateLocationListItem(targetId, updatedValue) {
  // Get location list container
  const locationListContainer = document.querySelector(".location-list");

  // Get location list item to be updated
  const locationListItem = locationListContainer.querySelector(
    `.location-list-item[id="${targetId}"]`
  );

  // Get element to be updated
  const element = locationListItem.querySelector("p");

  // Update element
  element.textContent = updatedValue;
}

function updateStoryCard(updatedValues) {
  // Get cards container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Update the intro card
  const card = cardsContainer.querySelector(`.story-intro`);

  // Update headline in intro-card
  const headline = card.querySelector("h1");

  // Update img in intro-card
  const img = card.querySelector("img");
  img.src = updatedValues.media.previewUrl;

  headline.textContent = updatedValues.title;

  // The preview image is determined by media type and set in
}
