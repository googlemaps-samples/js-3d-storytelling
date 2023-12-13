import { GOOGLE_MAPS_API_KEY } from "../env.js";
import { story } from "../main.js";

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

  const { cameraOptions } = story.properties;

  // Set the starting position and orientation of the camera
  cesiumViewer.camera.setView({
    destination: cameraOptions.position,
    orientation: {
      heading: Cesium.Math.toRadians(cameraOptions.heading),
      pitch: Cesium.Math.toRadians(cameraOptions.pitch),
      roll: Cesium.Math.toRadians(cameraOptions.roll),
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
