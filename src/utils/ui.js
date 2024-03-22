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


import {
  isValidYouTubeUrl,
  getYouTubeVideoId,
} from "../utils/youtube-loader.js";

/**
 * Sets the text content of an element selected by a selector.
 * @param {string} selector - The CSS selector for the element
 * @param {string} text - The text to set
 */
export function setTextContent(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Returns the preview URL for a given media.
 * If the URL is a valid YouTube URL, it returns the thumbnail URL of the video.
 * Otherwise, it returns the original URL.
 *
 * @param {string} url - The YouTube URL or any other URL.
 * @returns {string} - The preview URL.
 */
export function getPreviewUrl(url) {
  return isValidYouTubeUrl(url)
    ? `https://img.youtube.com/vi/${getYouTubeVideoId(url)}/hqdefault.jpg`
    : url;
}
