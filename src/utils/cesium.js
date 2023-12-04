import { GOOGLE_MAPS_API_KEY } from "../env.js";

// Camera height above the target when flying to a point.
const CAMERA_HEIGHT = 100;

// Todo: Replace this
const START_COORDINATES = {
  latitude: 37.7749,
  longitude: -122.4194,
  height: 100000,
};

/**
 * An export of the CesiumJS viewer instance to be accessed by other modules.
 * @type {Cesium.Viewer} The CesiumJS viewer instance.
 */
export let cesiumViewer;

/**
 * Adjusts the height of the given coordinates to be above the surface by the specified offset height.
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
    cartographic.height + CAMERA_HEIGHT
  );
}

/**
 * Flies the camera to the given coordinates with the specified offset to the surface.
 *
 * @param {object} options - Pass the params as options object.
 * @param {google.maps.LatLngLiteral} [options.coords] - The coordinates to fly to.
 * @param {Cesium.HeadingPitchRange} [options.offset] - The offset from the target in the local east-north-up reference frame centered at the target.
 * @param {Function | undefined} [options.onComplete] - The function to execute when the flight is complete.
 * @param {number | undefined} [options.duration] - The duration of the fly-to animation in seconds. If undefined, Cesium calculates an ideal duration based on the distance to be traveled by the flight.
 */
async function flyToBoundingSphere({ coords, offset, onComplete, duration }) {
  const adjustedCoords = await adjustCoordinateHeight(coords);

  cesiumViewer.camera.flyToBoundingSphere(
    new Cesium.BoundingSphere(adjustedCoords, 0),
    {
      offset,
      complete: onComplete,
      duration,
    }
  );
}

/**
 * Performs a fly-to animation on the Cesium viewer to the specified coordinates.
 *
 * @param {google.maps.LatLngLiteral} coords - The coordinates to fly to.
 * @param {Object | undefined} options - Options to pass for the fly-to animation.
 * @param {number | undefined} options.duration - The duration of the fly-to animation in seconds. If undefined, Cesium calculates an ideal duration based on the distance to be traveled by the flight.
 * @throws {Error} Throws an error if no coordinates are provided.
 */
export async function performFlyTo(coords, options = {}) {
  if (!coords) {
    throw new Error("No coordinates to fly-to provided.");
  }

  try {
    const { duration } = options;

    // Keep the current camera heading when flying to new coordinates
    const offset = {
      heading: cesiumViewer.camera.heading,
    };

    await flyToBoundingSphere({
      coords,
      offset,
      duration,
    });
  } catch (error) {
    console.error(`Error performing fly to: ${error}`);
  }
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

  const { latitude, longitude, height } = START_COORDINATES;

  // Set the starting position and orientation of the camera
  cesiumViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: 0, // no heading
      pitch: Cesium.Math.toRadians(-90), // -90 degrees to the tangent plane (looking down)
      roll: 0,
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
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
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
