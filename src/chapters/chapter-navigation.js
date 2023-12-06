import { getParams, setParams } from "../utils/prams.js";

/**
 * Initializes and manages chapter navigation for a story.
 * This function sets up navigation elements for the introduction and chapters of a story.
 * It determines the current chapter based on URL parameters and updates the UI accordingly.
 * @param {Story} story - The story object containing chapters and related data.
 */
export function initChapterNavigation(story) {
  const introNavigation = document.querySelector(".intro-navigation");
  const detailNavigation = document.querySelector(".detail-navigation");

  const params = getParams();
  const chapterParam = params.get("chapter");
  const chapterData = findChapterByTitle(story, chapterParam);

  toggleNavigationElements(introNavigation, detailNavigation, chapterParam);

  if (chapterData) {
    updateChapterContent(chapterData, story); // set current chapter data
  } else {
    updateChapterContent(story.properties, story, true); // Reset to story intro
    setupStartButton(story, introNavigation, detailNavigation);
  }
}

/**
 * Finds and returns a chapter from the story based on its title.
 * @param {Story} story - The story object.
 * @param {string} chapterTitle - The title of the chapter.
 * @return {Object|null} - The found chapter object or null if not found.
 */
function findChapterByTitle(story, chapterTitle) {
  return story.chapters.find((chapter) => chapter.title === chapterTitle);
}

/**
 * Toggles the active state of navigation elements based on chapter presence.
 * @param {HTMLElement} introNav - The introduction navigation element.
 * @param {HTMLElement} detailNav - The detailed navigation element.
 * @param {string|null} chapterParam - The current chapter parameter.
 */
function toggleNavigationElements(introNav, detailNav, chapterParam) {
  setNavigationActive(introNav, !chapterParam);
  setNavigationActive(detailNav, Boolean(chapterParam));
}

/**
 * Sets up the start button and its event listener for the introduction navigation.
 * @param {HTMLElement} introNavigation - The intro navigation element.
 * @param {Story} story - The story object.
 * @param {HTMLElement} detailNavigation - The detail navigation element.
 */
function setupStartButton(story, introNavigation, detailNavigation) {
  const startButton = introNavigation.querySelector("#start-button");
  startButton.addEventListener("click", () => {
    startStory(story, introNavigation, detailNavigation);
  });
}

/**
 * Activates the first chapter in the story and updates the configuration.
 * @param {Story} story - The story object.
 */
function startStory(story, introNavigation, detailNavigation) {
  const firstChapterTitle = story.chapters[0].title;
  setParams("chapter", firstChapterTitle);
  toggleNavigationElements(introNavigation, detailNavigation, true);
  updateChapterContent(story.chapters[0], story);
}

/**
 * Sets the active state of a navigation element.
 * @param {HTMLElement} navElement - The navigation element to modify.
 * @param {boolean} isActive - Whether the navigation element should be active.
 */
function setNavigationActive(navElement, isActive) {
  navElement.classList.toggle("active", isActive);
}

/**
 * Updates the content of the chapter detail section.
 * @param {Chapter} chapterData - The data object containing chapter details.
 * @param {Story} story - The story object.
 * @param {boolean} [isIntro=true] - Flag indicating if the current view is the introduction.
 */
function updateChapterContent(chapterData, story, isIntro = true) {
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
}
