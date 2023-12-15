// Define the type for basic Cesium camera options
type CesiumCameraOptions = {
  position: Cesium.Cartesian3; // The camera position in Cartesian coordinates
  heading: number; // Heading in radians
  pitch: number; // Pitch in radians
  roll: number; // Roll in radians
};

// Define the type for the shader options
type focusOptions = {
  focusRadius: number;
  showFocus: boolean;
  showLocationMarker: boolean;
};

type media = {
  url: string;
  previewUrl: string;
  mediaType: "image" | "video";
  mediaCredit: string;
};

// Define the type for the Segment
interface Chapter {
  title: string; // Title of the segment
  content: string; // Text content of the segment
  dateTime: string;
  coords: google.maps.LatLngLiteral; // Latitude and longitude coordinates using Google Maps type
  address: string; // Clear text address
  cameraOptions: CesiumCameraOptions; // Basic Cesium camera options
  focusOptions: focusOptions;
  media: media;
}

interface StoryProperties {
  title: string; // The title of the story
  date: string; // A date associated with the story
  description: string; // The description text
  createdBy: string; // The author
  cameraOptions: CesiumCameraOptions; // Basic Cesium camera options
  media: media;
}
// Define the NeighbourhoodStory as an array of Segments
interface Story {
  chapters: Chapter[];
  properties: StoryProperties;
}
