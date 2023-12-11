import { updateUI, story } from "../main.js";
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

    // Freeze the config object with all its properties
    deepFreeze(configData);

    return configData;
  } catch (error) {
    // Handle and report any errors during the process.
    throw `Failed to load and parse configuration data: ${error}`;
  }
}

/**
 * Updates the story chapter and saves it to local storage.
 * @param {Object} updatedChapter - The chapter object to be updated.
 * @returns {void}
 */
export async function setStory(updatedChapter) {
  // Find the chapter to be updated
  const chapterIndex = story.chapters.findIndex(
    (chapter) => Number(chapter.id) === Number(updatedChapter.id)
  );

  // Update chapter
  story.chapters[chapterIndex] = updatedChapter;

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
