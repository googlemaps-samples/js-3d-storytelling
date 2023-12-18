// Load the IFrame Player API code asynchronously.
export async function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    let tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    let firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    tag.addEventListener("load", resolve);
    tag.addEventListener("error", reject);
  });
}

let youtubePlayer;

/**
 * Initializes the YouTube iframe API and creates a new YouTube player.
 */
function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player("player", {
    events: {
      onStateChange: onPlayerStateChange,
    },
  });
}

/**
 * Handles the player state change event of embedded youtube video.
 * @param {Object} event - The event object.
 */
export function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.ENDED) {
    // Todo: go to next chapter
  }
}
