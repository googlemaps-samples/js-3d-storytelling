import { updateChapter } from "../chapters/chapter-navigation.js";
import { story } from "../main.js";
import { cesiumViewer } from "./cesium.js";

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
 * @param {string} The type of marker.
 * @returns {string} The marker SVG's data URI.
 */
async function createMarkerSvg(markerType) {
  const baseSvgElement = await fetchSvgContent("assets/icons/marker.svg");

  // Configurations for the base and icon SVG elements
  const baseConfig = {
    height: "60",
    width: "80",
    stroke: "white",
    fill: markerType === "place-marker" ? "red" : "#13B5C7",
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
 * @param {number | null} markerId - The id given to the entity object representing the selected marker.
 */
export function setSelectedMarker(markerId) {
  // If no markerID is provided, the getter returns undefined
  const newMarker = cesiumViewer.entities.getById(markerId);

  // Get the currently still selected marker
  const currentMarker =
    selectedMarkerId && cesiumViewer.entities.getById(selectedMarkerId);

  // Scale the previous selected marker back to the default scale
  if (currentMarker) {
    currentMarker.billboard.scale = defaultMarkerScale;
  }

  // Scale the new selected marker to 1
  if (newMarker) {
    newMarker.billboard.scale = 1;
  }

  // Update the selected marker ID
  selectedMarkerId = markerId;
}

/**
 * Remove single marker billboard.
 * @param {number} markerId - The entity ID for the marker billboard
 */
export function removeMarker(markerId) {
  cesiumViewer.entities.removeById(markerId);
}

/**
 * Hide marker billboard.
 * @param {number} markerId - The entity ID for the marker billboard
 */
export function hideMarker(markerId) {
  // If no markerID is provided, the getter returns undefined
  const marker = cesiumViewer.entities.getById(markerId);

  if (!marker) {
    return;
  }

  marker.show = false;
}

/**
 * Show marker billboard.
 * @param {number} markerId - The entity ID for the marker billboard
 */
export function showMarker(markerId) {
  // If no markerID is provided, the getter returns undefined
  const marker = cesiumViewer.entities.getById(markerId);

  if (!marker) {
    return;
  }
  marker.show = true;
}

/**
 * Handles the marker click
 * When a marker is clicked, there are multiple things happening:
 * 1. The camera is moved to the marker position
 * 2. The clicked marker is scaled up and the previously clicked marker is scaled down
 *
 * @param {object} click - The click event object
 */
async function handleClickOnMarker(click) {
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

  if (selectedMarkerId === markerId) {
    return;
  }

  const markerIndex = story.chapters.findIndex(
    (chapter) => chapter.id === markerId
  );

  updateChapter(markerIndex);
}

/**
 * Adds an event handler to the viewer which is used to pick an object that is under the 2d context of the mouse/pointer.
 */
function createMarkerClickHandler() {
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
    handleClickOnMarker(click);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK); // This defines that we want to listen for a click event
}

/**
 * Creates markers for each chapter's coordinate and attaches them to the viewer.
 * @param {Chapter[]} chapters - the story's chapters.
 */
export async function createMarkers(chapter) {
  if (!cesiumViewer) {
    console.error("Error creating markers: `cesiumViewer` is undefined");
    return;
  }

  const markerCoordinates = chapter.map(({ coords }) => {
    const { lng, lat } = coords;
    return Cesium.Cartesian3.fromDegrees(lng, lat);
  });

  // Modify the position to be on top of terrain (e.g. Rooftops, trees, etc.)
  // this has to be done with the whole coordinates array, because clamping single
  // coords to the ground terrain like this will not work.
  const coordsWithAdjustedHeight =
    await cesiumViewer.scene.clampToHeightMostDetailed(markerCoordinates);

  // iterate the coordinates
  coordsWithAdjustedHeight.forEach(async (coord, index) => {
    // add vertical offset between marker and terrain to allow for a line to be rendered in between
    const coordWithHeightOffset = addHeightOffset(coord, 28);
    const { id } = chapter[index];
    const markerSvg = await createMarkerSvg(id);

    // add the line and the marker
    cesiumViewer.entities.add({
      ...getPolylineConfiguration({ start: coord, end: coordWithHeightOffset }),
      ...getMarkerEntityConfiguration({
        position: coordWithHeightOffset,
        id,
        markerSvg,
      }),
    });

    // Select the marker if it was rerendered and already selected before
    if (selectedMarkerId === id) {
      setSelectedMarker(id);
    }
  });

  // add a click handler to the viewer which handles the click only when clicking on a billboard (Marker) instance
  createMarkerClickHandler();
}

export default createMarkers;
