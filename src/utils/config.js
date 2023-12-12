import { updateChapterContent } from "../chapters/chapter-navigation.js";

/**
 * Function to deep freeze an object.
 *
 * (See MDN deep freeze example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
 *
 * @param {Object} object - The object to freeze.
 * @returns {*} The frozen object.
 */
function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

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
 *  Usage example:
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
 * @param {Object} newChapter - The chapter object to be added.
 * @returns {void}
 */
export async function addStory(newChapter) {
  const chapterIds = story.chapters.map(({ id }) => id).filter(Boolean);
  // Increment hightest existing chapter id by one
  const newChapterId = Math.max(...chapterIds) + 1;

  // Add new chapter to story
  story.chapters.push({ ...newChapter, id: newChapterId });

  // Save updated object back to local storage
  localStorage.setItem("story", JSON.stringify(story));

  updateUI();
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

    // Check if the property is the chapters array
    if (property === "properties") {
      // Update chapter details
      updateChapterContent(target.properties, target, true);

      // Get cards container
      const cardsContainer = document.querySelector("#chapters-bar .cards");

      // Update the intro card
      const card = cardsContainer.querySelector(`.story-intro`);

      // Update headline in intro-card
      const headline = card.querySelector("h1");

      headline.textContent = updatedValue.title;
    } else {
      // Update chapter card
      updateChapterCard(target, property, updatedValue);

      // Update the location list item in the sidebar
      updateLocationListItem(target, updatedValue);
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

  // Get element to be updated
  const element = card.querySelector(`[data-input-name="${property}"]`) || null;

  if (!element) {
    return;
  }

  // Update element

  // Check if element is an image
  // If so, update the src attribute
  // Otherwise, update the text content
  if (property === "imageUrl") {
    element.src = updatedValue;
  } else {
    element.textContent = updatedValue;
  }
}

/**
 * Updates the value of a location list item.
 *
 * @param {HTMLElement} target - The target location list item to be updated.
 * @param {string} updatedValue - The updated value to be set.
 */
function updateLocationListItem(target, updatedValue) {
  // Get location list container
  const locationListContainer = document.querySelector(".location-list");

  // Get location list item to be updated
  const locationListItem = locationListContainer.querySelector(
    `.location-list-item[id="${target.id}"]`
  );

  // Get element to be updated
  const element = locationListItem.querySelector("p");

  // Update element
  element.textContent = updatedValue;
}
