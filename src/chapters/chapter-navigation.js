import { getParams, setParams } from "../utils/params.js";

// Html elements
/**
 * @type {HTMLNavvElement}
 */
let introNavigation = null;
/**
 * @type {HTMLNavvElement}
 */
let detailNavigation = null;
/**
 * @type {HTMLNavvElement}
 */
let startButton = null;

/**
 * Initializes and manages chapter navigation for a story.
 * This function sets up navigation elements for the introduction and chapters of a story.
 * It determines the current chapter based on URL parameters and updates the UI accordingly.
 * @param {Story} story - The story object containing chapters and related data.
 */
export function initChapterNavigation(story) {
  // Get navigation elements
  introNavigation = document.querySelector(".intro-navigation");
  detailNavigation = document.querySelector(".detail-navigation");
  startButton = introNavigation.querySelector("#start-button");

  // Get navigation buttons
  const backButton = detailNavigation.querySelector("#chapter-backward-button");
  const forwardButton = detailNavigation.querySelector(
    "#chapter-forward-button"
  );

  // Get the current chapter based on URL parameters
  const params = getParams();
  const chapterParam = params.get("chapter");
  //Finds and returns a chapter from the story based on its title.
  const chapterData = story.chapters.find(
    (chapter) => chapter.title === chapterParam
  );

  // Set up event listeners
  startButton.addEventListener("click", () => startStory(story));
  forwardButton.addEventListener("click", () => forwardCallback(story));
  backButton.addEventListener("click", () =>
    backwardCallback(story, introNavigation, detailNavigation)
  );

  // Initialize chapter content based on URL parameters
  chapterData
    ? toggleNavigationElements(true)
    : toggleNavigationElements(false);
  updateChapterContent(chapterData || story.properties, story, !chapterData);
}

/**
 * Activates the first chapter in the story and updates the configuration.
 * @param {Story} story - The story object.
 */
function startStory(story) {
  const firstChapterTitle = story.chapters[0].title;
  setParams("chapter", firstChapterTitle);
  toggleNavigationElements(firstChapterTitle);
  updateChapterContent(story.chapters[0], story, false);
}

const backwardCallback = (story) => {
  const newChapterIndex = getNewChapterIndex(story, "backward");

  if (newChapterIndex >= 0) {
    setParams("chapter", story.chapters[newChapterIndex].title);
    updateChapterContent(story.chapters[newChapterIndex], story, false);
  } else {
    setParams("chapter", null);
    updateChapterContent(story.properties, story);
    toggleNavigationElements(null);
  }
};

const forwardCallback = (story) => {
  const newChapterIndex = getNewChapterIndex(story, "forward");

  if (newChapterIndex < story.chapters.length) {
    setParams("chapter", story.chapters[newChapterIndex].title);
    updateChapterContent(story.chapters[newChapterIndex], story, false);
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
 * Calculates the index of the next or previous chapter.
 * @param {Story} story - The story object.
 * @param {'forward' | 'backward'} direction - The direction to move in.
 * @returns {number} - The index of the new chapter.
 */
function getNewChapterIndex(story, direction) {
  const currentChapterIndex = getCurrentChapterIndex(story);
  const increment = direction === "forward" ? 1 : -1;
  return currentChapterIndex + increment;
}

/**
 * Returns the index of the current chapter.
 * @param {Story} story - The story object.
 * @returns {number} - The index of the current chapter.
 */
function getCurrentChapterIndex(story) {
  const params = getParams();
  const chapterParam = params.get("chapter");
  return story.chapters.findIndex((chapter) => chapter.title === chapterParam);
}

/**
 * Updates the content of the chapter detail section.
 * @param {Chapter} chapterData - The data object containing chapter details.
 * @param {Story} story - The story object.
 * @param {boolean} [isIntro=true] - Flag indicating if the current view is the introduction.
 */
export function updateChapterContent(chapterData, story, isIntro = true) {
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
  const chapterIndex = getCurrentChapterIndex(story);
  const chapterIndexDisplay = `${chapterIndex + 1} / ${story.chapters.length}`;
  detailNavigation.querySelector("#chapter-index").textContent =
    chapterIndexDisplay;

  // if the last chapter is reached, disable the forward button
  // Check if the current chapter is the last chapter
  const forwardButton = document.querySelector("#chapter-forward-button");
  if (chapterIndex + 1 === story.chapters.length) {
    // Disable the forward button
    forwardButton.disabled = true;
  } else {
    // Enable the forward button
    forwardButton.disabled = false;
  }
}
