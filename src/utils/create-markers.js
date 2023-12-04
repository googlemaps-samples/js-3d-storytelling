import { cesiumViewer, performFlyTo } from "./cesium.js";

// The size of the marker in relation to the original SVG size.
// We are scaling it down to help preserve clarity when increasing marker size for the selected marker.
const defaultMarkerScale = 0.744;

/**
 * The instance of the click handler, used when clicking a marker on the map
 * This has to be destroyed/reset manually when changing the location and handling new locations
 * @type {Cesium.ScreenSpaceEventHandler}
 */
let markerClickHandler = null;

/**
 * @type {string} The ID of the selected marker
 */
let selectedMarkerId = null;

/**
 * Asynchronously fetches and parses SVG content from a URL.
 * @param {string} url - URL of the SVG resource.
 * @returns {Promise<Element>} A promise resolving to the SVG element.
 * @throws {Error} Throws an error if the fetch request fails.
 */
async function fetchSvgContent(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG from ${url}.`);
  }
  return new DOMParser().parseFromString(await response.text(), "image/svg+xml")
    .documentElement;
}

/**
 * Sets attributes on an SVG element.
 * @param {Element} svgElement - SVG element to modify.
 * @param {Object} attributes - Key-value pairs of attributes.
 */
function setSvgAttributes(svgElement, attributes) {
  Object.entries(attributes).forEach(([key, value]) =>
    svgElement.setAttribute(key, value)
  );
}

/**
 * Encodes an SVG element to a data URI format.
 * @param {Element} svgElement - SVG element to encode.
 * @returns {string} Data URI of the SVG element.
 */
function encodeSvgToDataUri(svgElement) {
  return `data:image/svg+xml,${encodeURIComponent(svgElement.outerHTML)}`;
}

/**
 * Creates a marker SVG for a given location.
 * @returns {string} The marker SVG's data URI.
 */
async function createMarkerSvg() {
  const baseSvgElement = await fetchSvgContent("assets/icons/marker.svg");

  // Configurations for the base and icon SVG elements
  const baseConfig = {
    height: "60",
    width: "80",
    stroke: "white",
  };

  setSvgAttributes(baseSvgElement, baseConfig);

  return encodeSvgToDataUri(baseSvgElement);
}

/**
 * Helper function to adjust entity height.
 * @param {Cesium.Cartesian3} coord - The original coordinate.
 * @param {number} heightOffset - The height to add to the original coordinate.
 * @returns {Cesium.Cartesian3} The adjusted coordinate.
 */
function addHeightOffset(coord, heightOffset) {
  const cartographic = Cesium.Cartographic.fromCartesian(coord);
  return Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + heightOffset
  );
}

/**
 * Helper function to create a polyline entity configuration.
 * @param {Cesium.Cartesian3} options.start - Starting coordinate.
 * @param {Cesium.Cartesian3} options.end - Ending coordinate.
 * @returns {Object} Polyline entity configuration.
 */
function getPolylineConfiguration({ start, end }) {
  return {
    polyline: {
      positions: [start, end],
      material: Cesium.Color.WHITE,
    },
  };
}

/**
 * Helper function to create a marker entity configuration.
 * @param {Cesium.Cartesian3} options.position - The position to place the marker.
 * @param {number} options.id - ID for the marker.
 * @param {string} options.markerSvg - Data URI for the marker SVG.
 * @returns {Cesium.Entity.ConstructorOptions} Marker entity configuration.
 */
function getMarkerEntityConfiguration({ position, id, markerSvg }) {
  return {
    position,
    id,
    billboard: {
      image: markerSvg,
      scale: defaultMarkerScale,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    },
  };
}

/**
 * Sets the selected marker and scales it to 1 while scaling the previous marker back to the default scale.
 * @param {Cesium.Entity} marker - The entity object representing the selected marker.
 */
export function setSelectedMarker(marker) {
  const selectedMarker =
    selectedMarkerId && cesiumViewer.entities.getById(selectedMarkerId);

  if (selectedMarker) {
    selectedMarker.billboard.scale = defaultMarkerScale;
  }

  if (marker) {
    // Scale the new selected marker to 1
    marker.billboard.scale = 1;
  }

  // Update the selected marker ID
  selectedMarkerId = marker?.id || null;
}

/**
 * Handles the marker click
 * When a marker is clicked, there are multiple things happening:
 * 1. The camera is moved to the marker position
 * 2. The clicked marker is scaled up and the previously clicked marker is scaled down
 * @param {object} click - The click event object
 * @param {google.maps.LatLngLiteral[]} coords - the current markers on the map
 */
async function handleClickOnMarker(click, coords) {
  // Raycast from click position returning intercepting object
  const pickedObject = cesiumViewer.scene.pick(click.position);
  // check if "primitive" property is available... (not available when clicking sky for example)
  if (!pickedObject || !pickedObject.primitive) {
    return;
  }

  // get primitive from object
  const { primitive } = pickedObject;
  // check if a billboard (marker) was clicked return and do nothing
  if (!(primitive instanceof Cesium.Billboard)) {
    return;
  }

  const marker = primitive.id;
  const markerId = marker.id;
  const currentMarker = coords.find(
    ({ lat, lng }) => `${lat}${lng}` === markerId
  );

  // if the same marker is clicked again, set the selected marker to null and close the sidebar
  if (selectedMarkerId === markerId) {
    setSelectedMarker(null);
  } else {
    setSelectedMarker(marker);
  }

  // move the camera to the clicked marker
  await performFlyTo(currentMarker.coords, {
    duration: 1,
  });
}

/**
 * Adds an event handler to the viewer which is used to pick an object that is under the 2d context of the mouse/pointer.
 * @param {google.maps.LatLngLiteral[]} coords - the current markers on the map
 */
function createMarkerClickHandler(coords) {
  if (markerClickHandler) {
    markerClickHandler.destroy();
  }

  // "Screen" click handler
  markerClickHandler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.canvas);

  // Disable default double click behaviour for cesium viewer on billboard entities
  cesiumViewer.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );

  // Basically an onClick statement
  markerClickHandler.setInputAction((click) => {
    handleClickOnMarker(click, coords);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK); // This defines that we want to listen for a click event
}

/**
 * Creates markers for each coordinate and attaches them to the viewer.
 * @param {google.maps.LatLngLiteral[]} coordinates - marker coordinates.
 */
async function createMarkers(coords) {
  if (!cesiumViewer) {
    console.error("Error creating markers: `cesiumViewer` is undefined");
    return;
  }

  const markerCoordinates = coords.map(({ lng, lat }) => {
    return Cesium.Cartesian3.fromDegrees(lng, lat);
  });

  // Modify the position to be on top of terrain (e.g. Rooftops, trees, etc.)
  // this has to be done with the whole coordinates array, because clamping single
  // coords to the ground terrain like this will not work.
  const coordsWithAdjustedHeight =
    await cesiumViewer.scene.clampToHeightMostDetailed(markerCoordinates);

  // iterate the coordinates
  coordsWithAdjustedHeight.forEach(async (coord) => {
    // add vertical offset between marker and terrain to allow for a line to be rendered in between
    const coordWithHeightOffset = addHeightOffset(coord, 28);
    const { lat, lng } = coord;
    const id = `${lat}${lng}`;
    const markerSvg = await createMarkerSvg();

    // add the line and the marker
    const markerEntity = cesiumViewer.entities.add({
      ...getPolylineConfiguration({ start: coord, end: coordWithHeightOffset }),
      ...getMarkerEntityConfiguration({
        position: coordWithHeightOffset,
        id,
        markerSvg,
      }),
    });

    // Select the marker if it was rerendered and already selected before
    if (selectedMarkerId === id) {
      setSelectedMarker(markerEntity);
    }
  });

  // add a click handler to the viewer which handles the click only when clicking on a billboard (Marker) instance
  createMarkerClickHandler(coords);
}

export default createMarkers;
