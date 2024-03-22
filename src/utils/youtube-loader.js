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

// Load the IFrame Player API code asynchronously.
export async function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    tag.addEventListener("load", resolve);
    tag.addEventListener("error", reject);
  });
}

// Wait for the YouTube API to be loaded
await loadYouTubeAPI();

/**
 * Checks if a given URL is a valid YouTube video URL.
 *
 * @param {string} url - The URL to be checked.
 * @returns {boolean} - Returns true if the URL is a valid YouTube video URL, otherwise returns false.
 */
export function isValidYouTubeUrl(url) {
  // Regex to check if the URL is a valid YouTube video URL
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return youtubeRegex.test(url);
}

/**
 * Extracts the YouTube video ID from a given URL.
 *
 * @param {string} url - The YouTube video URL.
 * @returns {string|null} - The YouTube video ID if found, otherwise null.
 */
export function getYouTubeVideoId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
