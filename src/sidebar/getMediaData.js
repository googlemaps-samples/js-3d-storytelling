import { isValidYouTubeUrl } from "./sidebar.js";

export function getMediaData(mediaUrl, mediaCredit) {
  let media = {
    url: "",
    previewUrl: "",
    type: "",
    mediaCredit: mediaCredit ?? "",
  };

  if (isValidYouTubeUrl(mediaUrl)) {
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    // const mediaUrl = `https://www.youtube.com/embed/${videoId}?v=2`;
    media.url = mediaUrl;
    media.previewUrl = thumbnailUrl;
    media.type = "video";
  } else {
    console.warn("Invalid YouTube URL");
    media.url = "";
    media.previewUrl = "";
    media.type = "";
  }
}
