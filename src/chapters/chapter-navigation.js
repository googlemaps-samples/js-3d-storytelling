function handleStartClick() {
  console.log("starting");
}

export function initChapterNavigation() {
  const introNavigation = document.querySelector(".intro-navigation");
  const detailNavigation = document.querySelector(".detail-navigation");
  let startButton = null;

  if (!introNavigation.classList.contains("active")) {
    introNavigation.classList.add("active");
    startButton = introNavigation.querySelector("#start-button");
    startButton.addEventListener("click", handleStartClick);
  } else if (startButton) {
    startButton.removeEventListener("click", handleStartClick);
  }

  detailNavigation.classList.remove("active");
}
