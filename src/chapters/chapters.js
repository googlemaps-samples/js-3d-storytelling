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
 * Adds a story intro card and cards for each chapter to the UI.
 *
 * @param {Story} story - The story to create the cards for
 */
export function addChaptersBar(story) {
  const cardsContainer = document.querySelector("#chapters-bar");

  const storyIntroCard = createStoryIntroCard(story.properties);
  cardsContainer.appendChild(storyIntroCard);

  for (const chapter of story.chapters) {
    const chapterCard = createChapterCard(chapter);
    cardsContainer.appendChild(chapterCard);
  }
}
