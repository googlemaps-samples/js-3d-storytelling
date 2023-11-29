/**
 * Returns a story intro card as HTML element.
 *
 * @param {StoryProperties} storyProperties - The story to create the intro card element for
 * @returns {HTMLElement} The story intro card element
 */
export function createStoryIntroCard(storyProperties) {
  const storyIntroCard = document.createElement("article");
  storyIntroCard.classList.add("card", "story-intro");

  const storyIntroImage = document.createElement("img");
  storyIntroImage.src = storyProperties.imageUrl;
  storyIntroCard.appendChild(storyIntroImage);

  const storyIntroTitle = document.createElement("h1");
  storyIntroTitle.textContent = storyProperties.title;
  storyIntroCard.appendChild(storyIntroTitle);

  return storyIntroCard;
}

/**
 * Returns a chapter card as HTML element.
 *
 * @param {Chapter} chapter - The chapter to create the card element for
 * @returns {HTMLElement} The chapter card element
 */
export function createChapterCard(chapter) {
  const chapterCard = document.createElement("article");
  chapterCard.classList.add("card", "chapter");

  const chapterImage = document.createElement("img");
  chapterImage.src = chapter.imageUrl;
  chapterCard.appendChild(chapterImage);

  const chapterDate = document.createElement("p");
  chapterDate.classList.add("date");
  chapterDate.textContent = chapter.dateTime;
  chapterCard.appendChild(chapterDate);

  const chapterTitle = document.createElement("h2");
  chapterTitle.textContent = chapter.title;
  chapterCard.appendChild(chapterTitle);

  return chapterCard;
}

/**
 * Fills the chapters bar with UI elements.
 *
 * @param {Story} story - The story to create the cards for
 */
export function addChaptersBar(story) {
  const barContainer = document.querySelector("#chapters-bar");

  // Add card elements to the bar container
  const cardsContainer = document.createElement("div");
  cardsContainer.classList.add("cards");

  const storyIntroCard = createStoryIntroCard(story.properties);
  cardsContainer.appendChild(storyIntroCard);

  for (const chapter of story.chapters) {
    const chapterCard = createChapterCard(chapter);
    cardsContainer.appendChild(chapterCard);
  }

  barContainer.appendChild(cardsContainer);

  // Add navigation button elements to the bar container
  const barNavigationButton = document.createElement("button");
  barNavigationButton.classList.add("navigation-button");

  const barNavigationPreviousButton = barNavigationButton.cloneNode(true);
  barNavigationPreviousButton.classList.add("previous");
  barNavigationPreviousButton.ariaLabel = "Show previous cards";

  const barNavigationNextButton = barNavigationButton.cloneNode(true);
  barNavigationNextButton.classList.add("next");
  barNavigationNextButton.ariaLabel = "Show next cards";

  barContainer.appendChild(barNavigationPreviousButton);
  barContainer.appendChild(barNavigationNextButton);

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
