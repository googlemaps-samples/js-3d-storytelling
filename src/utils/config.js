// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
    return await configResponse.json();
  } catch (error) {
    // Handle and report any errors during the process.
    throw `Failed to load and parse configuration data: ${error}`;
  }
}
