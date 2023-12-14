import { GOOGLE_MAPS_API_KEY } from "../env.js";
import { story } from "../main.js";

// The radius from the target point to position the camera.
const RADIUS = 800;
// Pitch -30 degrees in radians
const BASE_PITCH_RADIANS = -0.523599;
// Heading 180 degrees in radians
const BASE_HEADING_RADIANS = 3.14159;
// No base roll
const BASE_ROLL_RADIANS = 0;

/**
 * The default radius size of the  highlighted area
 * @readonly
 */
const DEFAULT_FOCUS_RADIUS = 250;

/**
 * An export of the CesiumJS viewer instance to be accessed by other modules.
 * @type {Cesium.Viewer} The CesiumJS viewer instance.
 */
export let cesiumViewer;

/**
 * @type {Cesium.Cesium3DTileset} The Google Photorealistic 3D tileset.
 */
let tileset = null;

/**
 * Asynchronously calculates the camera position and orientation based on the given parameters.
 *
 * @param {Object} coords - The coordinates of the target point as an object with properties `lat` (latitude) and `lng` (longitude).
 *
 * @returns {Promise<{
 *   position: Cesium.Cartesian3,
 *   heading: number,
 *   pitch: number,
 *   roll: number
 * }>} A promise that resolves to an object representing the camera position and orientation with properties:
 *   - position: A {@link Cesium.Cartesian3} representing the camera position in Earth-fixed coordinates.
 *   - heading: The heading angle of the camera (in radians).
 *   - pitch: The pitch angle of the camera (in radians).
 *   - roll: The roll angle of the camera (in radians).
 */
export async function calculateCameraPositionAndOrientation(coords) {
  // Convert latitude and longitude to Cartesian3 (Earth-fixed coordinates)
  const center = await adjustCoordinateHeight(coords);

  const headingRadians = BASE_HEADING_RADIANS;
  const pitchRadians = BASE_PITCH_RADIANS;
  const rollRadians = BASE_ROLL_RADIANS;

  // Create a local east-north-up coordinate system at the given center point
  const localEastNorthUp = Cesium.Transforms.eastNorthUpToFixedFrame(center);

  // Calculate the camera's offset in the local east-north-up coordinates
  // - 'radius * Math.sin(headingRadians)' gives the distance in the east direction
  // - 'radius * Math.cos(pitchRadians * -1)' gives the distance in the north direction
  // - 'radius * Math.sin(pitchRadians * -1)' gives the height above the center point
  const cameraOffset = new Cesium.Cartesian3(
    RADIUS * Math.sin(headingRadians),
    RADIUS * Math.cos(pitchRadians * -1),
    RADIUS * Math.sin(pitchRadians * -1)
  );

  // Calculate the camera's final position in Earth-fixed coordinates
  // This is achieved by transforming the local offset to the global coordinate system
  const cameraPosition = new Cesium.Cartesian3();
  Cesium.Matrix4.multiplyByPoint(
    localEastNorthUp,
    cameraOffset,
    cameraPosition
  );

  return {
    position: cameraPosition,
    heading: headingRadians,
    pitch: pitchRadians,
    roll: rollRadians,
  };
}

/**
 * Asynchronously adjusts the height of the given coordinates to the most detailed terrain height.
 *
 * @param {google.maps.LatLngLiteral} coords - The latitude and longitude coordinates.
 * @return {Promise<Cesium.Cartesian3>} A Cartesian3 object with adjusted height.
 */
async function adjustCoordinateHeight(coords) {
  const { lat, lng } = coords;

  const cartesian = Cesium.Cartesian3.fromDegrees(lng, lat);
  const clampedCoords = await cesiumViewer.scene.clampToHeightMostDetailed([
    cartesian,
  ]);

  const cartographic = Cesium.Cartographic.fromCartesian(clampedCoords[0]);

  return Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height
  );
}

/**
 * @typedef {Object} FlyToOptions - Options for the fly-to animation.
 * @property {Cartesian3} [position] - The final position of the camera in WGS84 (world) coordinates.
 * @property {Object} [orientation] - An object that contains heading, pitch and roll properties.
 * @property {number} [duration] - The duration of the fly-to animation in seconds. If undefined, Cesium calculates an ideal duration based on the distance to be traveled by the flight.
 *
 * Performs a fly-to animation on the Cesium viewer to the specified position.
 * @param {FlyToOptions} options - The "fly-to" options.
 */
export async function performFlyTo(options) {
  const { position, orientation, duration } = options;

  cesiumViewer.camera.flyTo({
    destination: position,
    orientation,
    duration,
  });
}

/**
 * Returns current camera options
 *
 * @return {Object} Object containing height, heading, pitch and roll options.
 */
export function getCameraOptions() {
  const { position, heading, pitch, roll } = cesiumViewer.camera;
  return {
    position,
    heading,
    pitch,
    roll,
  };
}

/**
 * The `initializeCesiumViewer` function is responsible for initializing a CesiumJS 3D map viewer,
 * configuring its default camera position and orientation, and adding both a 3D
 * tileset and attribution to the viewer.
 */
export async function initCesiumViewer() {
  // Set the default access token to null to prevent the CesiumJS viewer from requesting an access token
  Cesium.Ion.defaultAccessToken = null;

  // most options prevent the creation of certain built-in widgets (cesium ui elements)
  cesiumViewer = new Cesium.Viewer("cesium-container", {
    baseLayerPicker: false,
    imageryProvider: false,
    homeButton: false,
    fullscreenButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    geocoder: false,
    infoBox: false,
    selectionIndicator: false,
    timeline: false,
    animation: false,
  });

  // disable the default lighting of the globe
  cesiumViewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT;

  // this is foremost to improve the resolution of icons and text displayed in the cesium viewer
  cesiumViewer.resolutionScale = 2;

  // Disable free-look, the camera view direction can only be changed through translating or rotating
  cesiumViewer.scene.screenSpaceCameraController.enableLook = false;

  const {
    position: destination,
    heading,
    pitch,
    roll,
  } = story.properties.cameraOptions;

  // Set the starting position and orientation of the camera
  cesiumViewer.camera.setView({
    destination,
    orientation: {
      heading,
      pitch,
      roll,
    },
  });

  await createTileset();
  createAttribution();
}

/**
 * Asynchronously creates a Google Photorealistic 3D tileset using a provided Google Maps API key
 * and adds it to a CesiumJS viewer's scene.
 *
 * @throws {Error} If an error occurs during tileset creation, an error message is logged to the console.
 * @returns {Promise<void>} A Promise that resolves when the tileset has been successfully added to the viewer's scene.
 */
async function createTileset() {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(
      "https://tile.googleapis.com/v1/3dtiles/root.json?key=" +
        GOOGLE_MAPS_API_KEY
    );

    // Add tileset to the scene
    cesiumViewer.scene.primitives.add(tileset);
  } catch (error) {
    console.error(`Error creating tileset: ${error}`);
  }
}

function createAttribution() {
  if (!cesiumViewer) {
    console.error("Error creating attribution: `cesiumViewer` is undefined");
    return;
  }

  const cesiumCredits = cesiumViewer.scene.frameState.creditDisplay.container;

  // Create attribution text element
  const text = document.createTextNode(
    "Google • Landsat / Copernicus • IBCAO • Data SIO, NOAA, U.S. Navy, NGA, GEBCO • U.S. Geological Survey"
  );
  text.className = "cesium-credits__text";

  cesiumCredits.prepend(text);

  // Create image element for Google's logo
  const img = document.createElement("img");
  img.src = "assets/google-attribution.png";
  img.alt = "Google";

  cesiumCredits.prepend(img);
}

/**
 * Removes the custom radius shader from the tileset.
 */
export function removeCustomRadiusShader() {
  if (tileset.customShader) {
    tileset.customShader = undefined;
  }
}

/**
 * Adds a custom shader for the tiles to darken all tiles outside the radius around the center.
 *
 * @param {google.maps.LatLngLiteral} coordinates - The center coordinates.
 * @param {number} radius - The radius in meters.
 */
export function createCustomRadiusShader(
  coordinates,
  radius = DEFAULT_FOCUS_RADIUS
) {
  const { lat, lng } = coordinates;
  const center = Cesium.Cartesian3.fromDegrees(lng, lat);

  tileset.customShader = new Cesium.CustomShader({
    uniforms: {
      u_center: {
        type: Cesium.UniformType.VEC3,
        value: center,
      },
      u_radius: {
        type: Cesium.UniformType.FLOAT,
        value: radius,
      },
      u_darkenAmount: {
        type: Cesium.UniformType.FLOAT,
        value: 0.3, // The amount to darken the tile color from 0 = black to 1 = original color
      },
    },
    fragmentShaderText: `
      // Color tiles by distance to the center
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
      {
        float distanceInMeters = length(u_center - fsInput.attributes.positionWC.xyz);
        float range = 10.0 ;
        float min = u_radius - range;
        float max = u_radius + range;

        // Darken the tiles if the distance to the center is greater than the radius
        if(distanceInMeters > min && distanceInMeters < max)
        {
          float ratio = (distanceInMeters - min) / (max - min) * (u_darkenAmount - 1.0) - 1.0 * -1.0; 
          vec3 darkenedColor = material.diffuse * ratio;
          material.diffuse = darkenedColor;
        }

         if(distanceInMeters > max)
        {
          vec3 darkenedColor = material.diffuse * u_darkenAmount;
          material.diffuse = darkenedColor;
        }
      }
    `,
  });
}
