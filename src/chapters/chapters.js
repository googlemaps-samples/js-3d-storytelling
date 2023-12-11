import { createCustomRadiusShader } from "../utils/cesium.js";
import { setParams } from "../utils/params.js";
import {
  toggleNavigationElements,
  updateChapterContent,
} from "./chapter-navigation.js";

/**
 * Returns a story intro card as HTML element.
 *
 * @param {StoryProperties} storyProperties - The story to create the intro card element for
 * @returns {HTMLElement} The story intro card element
 */
export function createStoryIntroCard(storyProperties) {
  const card = document.createElement("article");
  card.classList.add("card", "story-intro");

  const storyIntroImage = document.createElement("img");
  storyIntroImage.src = storyProperties.imageUrl;
  card.appendChild(storyIntroImage);

  const storyIntroTitle = document.createElement("h1");
  storyIntroTitle.textContent = storyProperties.title;
  card.appendChild(storyIntroTitle);

  // set intro view
  card.addEventListener("click", () => {
    setParams("chapter");
    toggleNavigationElements(false);
    updateChapterContent(storyProperties, true);
    createCustomRadiusShader(storyProperties.coords, 1000);
  });

  return card;
}

/**
 * Returns a chapter card as HTML element.
 *
 * @param {Chapter} chapter - The chapter to create the card element for
 * @returns {HTMLElement} The chapter card element
 */
export function createChapterCard(chapter) {
  const card = document.createElement("article");
  card.classList.add("card", "chapter-card");
  card.id = chapter.id;

  const chapterImage = document.createElement("img");
  chapterImage.setAttribute("data-input-name", "imageUrl");
  chapterImage.src = chapter.imageUrl;
  card.appendChild(chapterImage);

  const chapterDate = document.createElement("p");
  chapterDate.setAttribute("data-input-name", "dateTime");
  chapterDate.classList.add("date");
  chapterDate.textContent = chapter.dateTime;
  card.appendChild(chapterDate);

  const chapterTitle = document.createElement("h2");
  chapterTitle.setAttribute("data-input-name", "title");
  chapterTitle.textContent = chapter.title;
  card.appendChild(chapterTitle);

  // set current chapter
  card.addEventListener("click", () => {
    setParams("chapter", chapter.title);
    toggleNavigationElements(true);
    updateChapterContent(chapter, false);
    createCustomRadiusShader(chapter.coords, 100);
  });

  return card;
}

/**
 * Fills the chapters bar with UI elements.
 *
 * @param {Story} story - The story to create the cards for
 */
export function addChaptersBar(story) {
  const barContainer = document.querySelector("#chapters-bar");

  // Add card elements to the bar container
  const cardsContainer = barContainer.querySelector(".cards");

  const storyIntroCard = createStoryIntroCard(story.properties);
  cardsContainer.appendChild(storyIntroCard);

  for (const chapter of story.chapters) {
    const chapterCard = createChapterCard(chapter);
    cardsContainer.appendChild(chapterCard);
  }

  const barNavigationPreviousButton = barContainer.querySelector(
    ".navigation-button.previous"
  );
  const barNavigationNextButton = barContainer.querySelector(
    ".navigation-button.next"
  );

  // Add click event handlers to the navigation buttons
  const cardElementWidth = cardsContainer.querySelector(".card").offsetWidth;
  const cardsGap = Number(
    getComputedStyle(cardsContainer).getPropertyValue("gap").replace("px", "")
  );
  const cardSectionWidth = cardElementWidth + cardsGap;

  barNavigationPreviousButton.addEventListener("click", () => {
    // Scroll one card back
    const newScrollLeft = cardsContainer.scrollLeft - cardSectionWidth;
    // Clamp new scroll position to the next full card on the left
    const newClampedScrollLeft =
      newScrollLeft - (newScrollLeft % cardSectionWidth);

    cardsContainer.scrollTo({
      left: newClampedScrollLeft,
      behavior: "smooth",
    });
  });

  barNavigationNextButton.addEventListener("click", () => {
    // Scroll one card further
    const newScrollLeft = cardsContainer.scrollLeft + cardSectionWidth;
    // Clamp new scroll position to the next full card on the left
    const newClampedScrollLeft =
      newScrollLeft - (newScrollLeft % cardSectionWidth);

    cardsContainer.scrollTo({
      left: newClampedScrollLeft,
      behavior: "smooth",
    });
  });
}
