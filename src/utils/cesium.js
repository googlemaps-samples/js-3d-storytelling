import { GOOGLE_MAPS_API_KEY } from "../env.js";
import { story } from "../main.js";

// Camera height above the target when flying to a point.
const CAMERA_HEIGHT = 100;

// Pitch 30 degrees downwards
const BASE_PITCH = -30;

// Camera heading (rotation), pitch (tilt), and range (distance) for resetting view.
const CAMERA_OFFSET = {
  heading: 0, // No rotation offset.
  pitch: Cesium.Math.toRadians(BASE_PITCH),
  range: 800, // 800 meters from the center.
};

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
      ...CAMERA_OFFSET,
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
 * Returns current camera options
 *
 * @return {Object} Object containing height, heading, pitch and roll options.
 */
export function getCameraOptions() {
  const { positionCartographic, heading, pitch, roll } = cesiumViewer.camera;
  return {
    height: positionCartographic.height,
    heading: Cesium.Math.toDegrees(heading),
    pitch: Cesium.Math.toDegrees(pitch),
    roll: Cesium.Math.toDegrees(roll),
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

  const { coords, cameraOptions } = story.properties;

  // Set the starting position and orientation of the camera
  cesiumViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      coords.lng,
      coords.lat,
      cameraOptions.height
    ),
    orientation: {
      heading: cameraOptions.heading, // no heading
      pitch: Cesium.Math.toRadians(cameraOptions.pitch),
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
export function createCustomRadiusShader(coordinates, radius) {
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
