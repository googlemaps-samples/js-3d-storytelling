import { story } from "../main.js";
import { createChapterCard } from "../chapters/chapters.js";
import {
  getChapterIndexFromId,
  resetToIntro,
  updateChapterContent,
  updateDetailsNavigation,
} from "../chapters/chapter-navigation.js";
import {
  createCustomRadiusShader,
  removeCustomRadiusShader,
  DEFAULT_HIGHLIGHT_RADIUS,
} from "../utils/cesium.js";

import {
  createMarkers,
  hideMarker,
  showMarker,
  removeMarker,
} from "./create-markers.js";

import { getPreviewUrl } from "../utils/ui.js";

// Properties of a chapter that can be edited
const chapterProperties = [
  "title",
  "content",
  "address",
  "imageUrl",
  "dateTime",
  "imageCredit",
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
