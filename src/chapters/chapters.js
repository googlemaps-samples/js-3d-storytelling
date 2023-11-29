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
 * Adds cards for each chapter to the UI.
 *
 * @param {Story} story - The story to create the cards for
 */
export function addChaptersBar(story) {
  const cardsContainer = document.querySelector("#chapters-bar");

  for (const chapter of story.chapters) {
    const chapterCard = createChapterCard(chapter);
    cardsContainer.appendChild(chapterCard);
  }
}
