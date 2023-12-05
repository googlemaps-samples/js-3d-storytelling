import { story } from "./main.js";

const detailContainer = document.querySelector(".chapter-detail");
const chapterTitleElement = detailContainer.querySelector("h2");
const heroElement = detailContainer.querySelector(".hero");
const contentElement = detailContainer.querySelector(".description");
const attributionElement = detailContainer.querySelector(".attribution");
const dateElement = detailContainer.querySelector(".date");
const placeElement = detailContainer.querySelector(".place");

export const updateChapterDetail = (id) => {
  const chapterDetails = story.chapters.find(({ title }) => title === id);

  if (!chapterDetails) {
    return;
  }

  chapterTitleElement.textContent = chapterDetails.title;
  contentElement.textContent = chapterDetails.content;
  attributionElement.textContent = chapterDetails.imageCredit;
  dateElement.textContent = chapterDetails.dateTime;
  placeElement.textContent = chapterDetails.address;
  heroElement.src = chapterDetails.imageUrl;
};
