import { updateChapterDetail } from "../detail.js";

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

  card.addEventListener("click", (event) => {
    setCustomConfig("chapter", "intro");
    updateChapterDetail("intro");
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
  card.classList.add("card", "chapter");

  const chapterImage = document.createElement("img");
  chapterImage.src = chapter.imageUrl;
  card.appendChild(chapterImage);

  const chapterDate = document.createElement("p");
  chapterDate.classList.add("date");
  chapterDate.textContent = chapter.dateTime;
  card.appendChild(chapterDate);

  const chapterTitle = document.createElement("h2");
  chapterTitle.textContent = chapter.title;
  card.appendChild(chapterTitle);

  card.addEventListener("click", (event) => {
    setCustomConfig("chapter", chapter.title);
    updateChapterDetail(chapter.title);
  });

  return card;
}

/**
 * Sets overrides for the configuration data as URL hash parameters.
 * If the passed value is `undefined`, the given parameter will be removed from the URL.
 *
 * @param {string} parameter - The name of the URL hash parameter to set.
 * @param {string | number | Array<string | number> | undefined} value - The value of the URL hash parameter to set.
 */
export const setCustomConfig = (parameter, value) => {
  const params = new URLSearchParams(window.location.hash.replace("#", ""));

  if (value) {
    if (Array.isArray(value)) {
      // Delete array parameter values and add new array values
      params.delete(parameter);
      for (let index = 0; index < value.length; index++) {
        params.append(parameter, value[index]);
      }
    } else {
      // Override parameter value
      params.set(parameter, value);
    }
  } else {
    // Remove parameter value
    params.delete(parameter);
  }

  window.location.hash = params;
};

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
