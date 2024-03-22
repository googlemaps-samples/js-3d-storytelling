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

import { story } from "../main.js";
import {
  createCustomRadiusShader,
  performFlyTo,
  removeCustomRadiusShader,
} from "../utils/cesium.js";
import { setSelectedMarker } from "../utils/create-markers.js";
import { getParams, setParams } from "../utils/params.js";
import { loadSvg } from "../utils/svg.js";
import { setTextContent } from "../utils/ui.js";
import {
  getYouTubeVideoId,
  isValidYouTubeUrl,
} from "../utils/youtube-loader.js";

/**
 * The time in seconds between each chapter progression
 * @readonly
 */
const CHAPTER_DURATION = 3;

/**
 * The time in seconds a fly to animation takes
 */
const FLY_TO_DURATION = 2;

// SVG icons
/**
 * Icon shown to pause the autoplay
 */
const PAUSE_ICON = await loadSvg("round-pause-button");
/**
 * Icon shown to pause the autoplay
 */
const PLAY_ICON = await loadSvg("round-play-button");

// Html elements
/** The nav element shown on the intro details overlay
 * @type {HTMLNavElement}
 */
const introNavigation = document.querySelector(".intro-navigation");
/** The nav element shown on the story details overlay
 * @type {HTMLNavElement}
 */
const detailNavigation = document.querySelector(".detail-navigation");
/** The button to start the story / leave the intro overlay with
 * @type {HTMLButtonElement}
 */
const startButton = introNavigation.querySelector("#start-story");
/** The button to play the story chapter by chapter
 * @type {HTMLButtonElement}
 */
const autoplayButton = detailNavigation.querySelector("#autoplay-story");
/** The button to progress the story backward with
 * @type {HTMLButtonElement}
 */
const backButton = detailNavigation.querySelector("#chapter-backward");
/** The button to progress the story forward with
 * @type {HTMLButtonElement}
 */
const forwardButton = detailNavigation.querySelector("#chapter-forward");

/**
 * The id used to identify the timeout instance for the story progression
 * @type {number | null}
 * @default null
 */
let timeoutId = null;

/**
 * The id used to identify the current step of the autoplay
 * @type {number}
 * @default 0
 */
let autoplayStep = 0;

/**
 * Initializes and manages chapter navigation for a story.
 * This function sets up navigation elements for the introduction and chapters of a story.
 * It determines the current chapter based on URL parameters and updates the UI accordingly.
 */
export function initChapterNavigation() {
  // Set up event listeners
  startButton.addEventListener("click", () => {
    activateNavigationElement("details");
    updateChapter(0);
  });

  forwardButton.addEventListener("click", () => {
    setNextChapter();
    stopAutoplay();
  });

  backButton.addEventListener("click", () => {
    setPreviousChapter();
    stopAutoplay();
  });

  autoplayButton.addEventListener("click", autoplayClickHandler);

  // Get the current chapter based on URL parameters
  const chapterIndex = getCurrentChapterIndex();

  // Initialize chapter content based on URL parameters
  if (typeof chapterIndex === "number") {
    updateChapter(chapterIndex);
  } else {
    resetToIntro();
  }
}

/**
 * Stops the autoplay chapter progression of the story.
 */
function stopAutoplay() {
  autoplayButton.innerHTML = PLAY_ICON;
  clearTimeout(timeoutId);
  timeoutId = null;
}

/**
 * Progresses to the next chapter and stops progression if the current chapter is the last one.
 */
function setNextAutoplayStep() {
  // Convert from seconds to milliseconds
  const flyToDurationMillis = FLY_TO_DURATION * 1000;
  const chapterDurationMillis = CHAPTER_DURATION * 1000;

  // The interval duration is the sum of the fly to duration and the chapter duration
  // autoplayStep = 0 means the first step, so the wait time is only the chapter duration
  const timeoutDuration =
    autoplayStep === 0
      ? chapterDurationMillis
      : chapterDurationMillis + flyToDurationMillis;

  timeoutId = setTimeout(() => {
    autoplayStep++; // Increment the autoplay step
    setNextChapter(); // Update the chapter content
    setNextAutoplayStep(); // Start the next autoplay step
  }, timeoutDuration);

  // If the current chapter is the last one, stop the autoplay
  if (getCurrentChapterIndex() === story.chapters.length - 1) {
    stopAutoplay();
  }
}

/**
 * Starts the autoplay chapter progression.
 */
function autoplayClickHandler() {
  // If the autoplay is already active, stop it
  if (timeoutId) {
    stopAutoplay();
  } else {
    // If the autoplay is not active, start it
    setNextAutoplayStep();
    autoplayButton.innerHTML = PAUSE_ICON;
  }
}

/**
 * Sets the previous chapter as the current chapter.
 */
const setPreviousChapter = () => {
  const newChapterIndex = getCurrentChapterIndex() - 1;

  // If the new chapter index is positive, update the current chapter
  if (newChapterIndex >= 0) {
    updateChapter(newChapterIndex);
    // when going back further in the chapters, go back to teh intro
  } else {
    resetToIntro();
  }
};

/**
 * Continues to the next chapter in the story.
 */
const setNextChapter = () => {
  const newChapterIndex = getCurrentChapterIndex() + 1;

  // If the new chapter index is less than the total number of chapters, update the current chapter
  // (Then did not reach end of chapters)
  if (newChapterIndex < story.chapters.length) {
    updateChapter(newChapterIndex);
  }
};

/**
 * Resets the application to the introductory state.
 */
export function resetToIntro() {
  const { cameraOptions } = story.properties;
  const { position, pitch, heading, roll } = cameraOptions;

  setParams("chapterId", null); // Clear the chapter parameter
  setSelectedMarker(null); // "Deselect" current marker
  setSelectedChapterCard(null, true); // Set the selected chapter card
  updateChapterContent(story.properties); // Update the chapter details content
  activateNavigationElement("intro"); // Activate the introduction navigation
  removeCustomRadiusShader(); // Remove the custom radius shader
  // Fly back to the starting position
  performFlyTo({
    position,
    orientation: {
      roll,
      pitch,
      heading,
    },
    duration: FLY_TO_DURATION,
  });
}

/**
 * Updates the current chapter of the story based on the given chapter index.
 * @param {number} chapterIndex - The index of the chapter to be updated.
 */
export function updateChapter(chapterIndex) {
  const chapter = story.chapters.at(chapterIndex);
  const { cameraOptions, coords, id: chapterId } = chapter;
  const { position, pitch, heading, roll } = cameraOptions;

  setSelectedMarker(chapterId); // Set the selected marker
  setSelectedChapterCard(chapterId); // Set the selected chapter card
  setParams("chapterId", chapterId); // Set the chapter parameter
  updateChapterContent(chapter, false); // Update the chapter details content
  activateNavigationElement("details"); // Activate the details navigation

  // Check if the current chapter has a focus and create or remove the custom radius shader accordingly
  const hasFocus = Boolean(
    story.chapters[chapterIndex]?.focusOptions?.showFocus
  );

  if (hasFocus) {
    const radius = story.chapters[chapterIndex].focusOptions.focusRadius;

    createCustomRadiusShader(coords, radius); // Create the custom radius shader
  } else {
    removeCustomRadiusShader(); // Remove the custom radius shader
  }

  // Fly to the new chapter location
  performFlyTo({
    position,
    orientation: {
      roll,
      pitch,
      heading,
    },
    duration: FLY_TO_DURATION,
  });
}

/**
 * Sets the active classname on the navigation elements based on chapter presence.
 * @param {'intro' | 'details'} chapterParam - The navigation element to be toggled.
 */
export function activateNavigationElement(navName) {
  introNavigation.classList.toggle("active", navName === "intro");
  detailNavigation.classList.toggle("active", navName === "details");
}

/**
 * Returns the index of the current chapter.
 * @returns {number} - The index of the current chapter.
 */
export function getCurrentChapterIndex() {
  const params = getParams();
  const chapterId = params.get("chapterId");
  // Get the index of the current chapter
  return getChapterIndexFromId(chapterId);
}

/**
 * Returns the index of the chapter with the given id.
 * @param {string} chapterId - The id of the chapter to be found.
 * @returns {number | null} - The index of the chapter with the given id.
 */
export function getChapterIndexFromId(chapterId) {
  return chapterId === null
    ? null
    : story.chapters.findIndex((chapter) => chapter.id == chapterId);
}

/**
 * Updates the details navigation. This includes the chapter index and
 * the forward button (if the current chapter is the last).
 */
export function updateDetailsNavigation() {
  // Update chapter index
  const chapterIndex = getCurrentChapterIndex() + 1;
  // Displays the current chapter index
  detailNavigation.querySelector(
    "#chapter-index"
  ).textContent = `${chapterIndex} / ${story.chapters.length}`;

  // If the last chapter is reached, disable the forward button
  // Check if the current chapter is the last chapter
  if (chapterIndex === story.chapters.length) {
    // Disable the forward button
    forwardButton.disabled = true;
  } else {
    // Enable the forward button
    forwardButton.disabled = false;
  }
}

/**
 * Updates the content of the chapter detail section.
 * @param {Chapter} chapter - The data object containing chapter details
 * @param {boolean} [isIntro=true] - Flag indicating if the current view is the introduction.
 */
export function updateChapterContent(chapter, isIntro = true) {
  updateDetailsNavigation();

  setTextContent(".story-title", isIntro ? "" : chapter.title);
  setTextContent(".chapter-detail h2", chapter.title);
  setTextContent(
    ".description",
    isIntro ? chapter.description : chapter.content
  );

  setTextContent(".date", isIntro ? "" : chapter.dateTime);
  setTextContent(".place", chapter.address);

  // Update image or video
  setMediaContent(chapter.imageUrl);

  // Update image or video credit
  const imageCredit = chapter.imageCredit
    ? `Image credit: ${chapter.imageCredit}`
    : "";

  setTextContent(".story-intro-attribution", isIntro ? imageCredit : "");
  setTextContent(".attribution", isIntro ? "" : imageCredit);

  // Update author and date in intro
  setTextContent(
    ".story-intro-author",
    isIntro && chapter.createdBy ? `by: ${chapter.createdBy}` : ""
  );

  setTextContent(".story-intro-date", isIntro ? chapter.date : "");

  // Update chapter index and forward button state
  updateChapterIndexAndNavigation();
}

/**
 * Updates the chapter index display and the state of the forward navigation button.
 */
function updateChapterIndexAndNavigation() {
  const chapterIndex = getCurrentChapterIndex();
  const chapterIndexDisplay = `${chapterIndex + 1} / ${story.chapters.length}`;
  setTextContent("#chapter-index", chapterIndexDisplay);

  // Update forward button state
  forwardButton.disabled = chapterIndex + 1 === story.chapters.length;
}

/**
 * Sets the media content in the media container based on the provided URL.
 * If the URL is a valid YouTube URL, it creates an embedded YouTube player.
 * If the URL is not a valid YouTube URL, it displays an image.
 * @param {string} url - The URL of the media content.
 */
function setMediaContent(url) {
  const mediaContainer = document.getElementById("media-container");

  // Clear previous content
  mediaContainer.innerHTML = "";

  if (isValidYouTubeUrl(url)) {
    const iframeElement = document.createElement("div");
    iframeElement.id = "player";
    mediaContainer.appendChild(iframeElement);

    new YT.Player("player", {
      height: "100%",
      width: "100%",
      videoId: getYouTubeVideoId(url),
    });
  } else if (url) {
    const imgElement = document.createElement("img");
    imgElement.src = url;
    mediaContainer.appendChild(imgElement);
  }
}

/**
 * Sets the selected chapter- or story intro card based on the provided chapterId and isIntro flag.
 * @param {string} chapterId - The ID of the chapter card to be selected.
 * @param {boolean} [isIntro=false] - Indicates whether the chapter card is an intro card.
 * @returns {void}
 */
function setSelectedChapterCard(chapterId, isIntro = false) {
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Remove selected style from previous card if there is one
  const currentlySelectedCard = cardsContainer.querySelector(".selected");
  if (currentlySelectedCard) {
    currentlySelectedCard.classList.remove("selected");
  }

  let card;
  // Get card to be deleted
  if (isIntro) {
    card = cardsContainer.querySelector(".card.story-intro");
  } else {
    card = cardsContainer.querySelector(`.card[id="${chapterId}"]`);
  }

  if (!card) {
    return;
  }

  // add selected style
  card.classList.add("selected");
}
