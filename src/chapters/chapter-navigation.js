import { story } from "../main.js";
import { getParams, setParams } from "../utils/params.js";

// Html elements
/** The nav element shown on the intro details overlay
 * @type {HTMLNavvElement}
 */
const introNavigation = document.querySelector(".intro-navigation");

/** The nav element shown on the story details overlay
 * @type {HTMLNavvElement}
 */
const detailNavigation = document.querySelector(".detail-navigation");

/** The button to start the story / leave the intro overlay with
 * @type {HTMLNavvElement}
 */
const startButton = introNavigation.querySelector("#start-button");

/** The button to progress the story backward with
 * @type {HTMLNavvElement}
 */
const backButton = detailNavigation.querySelector("#chapter-backward");

/** The button to progress the story forward with
 * @type {HTMLNavvElement}
 */
const forwardButton = detailNavigation.querySelector("#chapter-forward");

/**
 * Initializes and manages chapter navigation for a story.
 * This function sets up navigation elements for the introduction and chapters of a story.
 * It determines the current chapter based on URL parameters and updates the UI accordingly.
 */
export function initChapterNavigation() {
  // Get the current chapter based on URL parameters
  const params = getParams();
  const chapterParam = params.get("chapter");
  //Finds and returns a chapter from the story based on its title.
  const chapterData = story.chapters.find(
    (chapter) => chapter.title === chapterParam
  );

  // Set up event listeners
  startButton.addEventListener("click", startStory);
  forwardButton.addEventListener("click", setNextChapter);
  backButton.addEventListener("click", setPreviousChapter);

  // Initialize chapter content based on URL parameters
  chapterData
    ? toggleNavigationElements(true)
    : toggleNavigationElements(false);
  updateChapterContent(chapterData || story.properties, !chapterData);
}

/**
 * Activates the first chapter in the story and updates the configuration.
 */
function startStory() {
  const firstChapterTitle = story.chapters[0].title;
  setParams("chapter", firstChapterTitle);
  toggleNavigationElements(firstChapterTitle);
  updateChapterContent(story.chapters[0], false);
}

const setPreviousChapter = () => {
  const newChapterIndex = getCurrentChapterIndex() - 1;

  if (newChapterIndex >= 0) {
    setParams("chapter", story.chapters[newChapterIndex].title);
    updateChapterContent(story.chapters[newChapterIndex], false);
  } else {
    setParams("chapter", null);
    updateChapterContent(story.properties);
    toggleNavigationElements(null);
  }
};

const setNextChapter = () => {
  const newChapterIndex = getCurrentChapterIndex() + 1;

  if (newChapterIndex < story.chapters.length) {
    setParams("chapter", story.chapters[newChapterIndex].title);
    updateChapterContent(story.chapters[newChapterIndex], false);
  }
};

/**
 * Toggles the active state of navigation elements based on chapter presence.
 * @param {string|null} chapterParam - The current chapter parameter.
 */
export function toggleNavigationElements(chapterParam) {
  introNavigation.classList.toggle("active", !chapterParam);
  detailNavigation.classList.toggle("active", Boolean(chapterParam));
}

/**
 * Returns the index of the current chapter.
 * @returns {number} - The index of the current chapter.
 */
const getCurrentChapterIndex = () => {
  const params = getParams();
  const chapterParam = params.get("chapter");
  return story.chapters.findIndex((chapter) => chapter.title === chapterParam);
};

/**
 * Updates the content of the chapter detail section.
 * @param {Chapter} chapterData - The data object containing chapter details
 * @param {boolean} [isIntro=true] - Flag indicating if the current view is the introduction.
 */
export function updateChapterContent(chapterData, isIntro = true) {
  const chapterDetail = document.querySelector(".chapter-detail");

  chapterDetail.querySelector(".story-title").textContent = isIntro
    ? ""
    : story.properties.title;

  chapterDetail.querySelector("h2").textContent = isIntro
    ? story.properties.title
    : chapterData.title;

  chapterDetail.querySelector(".description").textContent = isIntro
    ? story.properties.description
    : chapterData.content;

  chapterDetail.querySelector(".date").textContent = chapterData.date;
  chapterDetail.querySelector(".place").textContent = chapterData.place;
  chapterDetail.querySelector(".hero").src = chapterData.imageUrl;

  const imageCredit = isIntro
    ? story.properties.createdBy
    : `Image credit: ${chapterData.imageCredit}`;

  chapterDetail.querySelector(".attribution").textContent = imageCredit;

  // update chapter index
  const chapterIndex = getCurrentChapterIndex();
  const chapterIndexDisplay = `${chapterIndex + 1} / ${story.chapters.length}`;
  detailNavigation.querySelector("#chapter-index").textContent =
    chapterIndexDisplay;

  // if the last chapter is reached, disable the forward button
  // Check if the current chapter is the last chapter
  if (chapterIndex + 1 === story.chapters.length) {
    // Disable the forward button
    forwardButton.disabled = true;
  } else {
    // Enable the forward button
    forwardButton.disabled = false;
  }
}
