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

// Define the type for the Segment
interface Chapter {
  id: number;
  title: string; // Title of the segment
  imageUrl: string; // URL for the segment's image (google or custom)
  imageCredit: string; // Credit for the segment's image
  content: string; // Text content of the segment
  dateTime: string;
  coords: google.maps.LatLngLiteral; // Latitude and longitude coordinates using Google Maps type
  address: string; // Clear text address
  cameraOptions: CesiumCameraOptions; // Basic Cesium camera options
  focus: focusOptions;
}

interface StoryProperties {
  imageUrl: string; // The image url for the intro card
  imageCredit: string; // The image credit for the intro card
  title: string; // The title of the story
  date: string; // A date associated with the story
  description: string; // The description text
  createdBy: string; // The author
  cameraOptions: CesiumCameraOptions; // Basic Cesium camera options
}
// Define the NeighbourhoodStory as an array of Segments
interface Story {
  chapters: Chapter[];
  properties: StoryProperties;
}
