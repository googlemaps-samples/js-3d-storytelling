// Define the type for basic Cesium camera options
type CesiumCameraOptions = {
  position: Cesium.Cartesian3; // The camera position in Cartesian coordinates
  heading: number; // Heading in radians
  pitch: number; // Pitch in radians
  roll: number; // Roll in radians
};

// Define the type for the Segment
type Location = {
  title: string; // Title of the segment
  imageUrl: string; // URL for the segment's image (google or custom)
  imageCredit: string; // Credit for the segment's image
  content: string; // Text content of the segment
  dateTime: string;
  coords: google.maps.LatLngLiteral; // Latitude and longitude coordinates using Google Maps type
  address: string; // Clear text address
  cameraOptions: CesiumCameraOptions; // Basic Cesium camera options
};

// Define the NeighbourhoodStory as an array of Segments
interface Story {
  segments: Segment[];
  storyTitle: string;
  createdBy: string;
}
