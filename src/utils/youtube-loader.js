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

export let youtubePlayer;

/**
 * Initializes the YouTube iframe API and creates a new YouTube player.
 * This function will execute as soon as the player API code downloads
 * see https://developers.google.com/youtube/iframe_api_reference
 */
function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player("player", {
    events: {
      onStateChange: onPlayerStateChange,
    },
  });
}

export function isValidYouTubeUrl(url) {
  // Regex to check if the URL is a valid YouTube video URL
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return youtubeRegex.test(url);
}

export function getYouTubeVideoId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
