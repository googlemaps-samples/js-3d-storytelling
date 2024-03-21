import {
  story,
  createLocationItem,
  initDragAndDrop,
  createEditMenus,
} from "./sidebar.js";
import { GOOGLE_MAPS_API_KEY } from "../env.js";
import { createChapterCard } from "../chapters/chapters.js"
import {
  resetToIntro,
  getChapterIndexFromId,
  updateDetailsNavigation,
  updateChapterContent,
} from "../chapters/chapter-navigation.js";
import { getPreviewUrl } from "../utils/ui.js";
import {
  createCustomRadiusShader,
  removeCustomRadiusShader,
  DEFAULT_HIGHLIGHT_RADIUS,
} from "../utils/cesium.js";
import {
  createMarkers,
  hideMarker,
  showMarker,
  removeMarker,
} from "../utils/create-markers.js";

import { FIREBASE_API_KEY } from "../../env.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, Timestamp,addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "d-area-explorer-staging.firebaseapp.com",
  projectId: "d-area-explorer-staging",
  storageBucket: "d-area-explorer-staging.appspot.com",
  messagingSenderId: "862242299614",
  appId: "1:862242299614:web:815da51faf02d9373f2c4f",
  measurementId: "G-540GBW9XC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app,"metrics-db");

// Properties of a chapter that can be edited
const chapterProperties = [
  "title",
  "content",
  "address",
  "imageUrl",
  "dateTime",
  "imageCredit",
  "showFocus",
  "radius",
  "showLocationMarker",
  "cameraOptions",
];

const sidebarHTMLString = await fetch("/demo/sidebar.html").then((response) =>
  response.text()
);
const parser = new DOMParser();
const htmlDocument = parser.parseFromString(sidebarHTMLString, "text/html");
const sidebarElement = htmlDocument.querySelector("aside");

document.body.prepend(sidebarElement);

/**
 * Asynchronously initializes and loads the Google Maps JavaScript API with specific configurations.
 * This function is responsible for adding a script to the document head, loading the Google Maps Places library,
 * and creating a PlacesService for use in the application.
 *
 * @param {string} GOOGLE_MAPS_API_KEY - The Google Maps API key required for API access.
 */
export async function initGoogleMaps() {
  try {
    const script = document.createElement("script");
    script.type = "text/javascript";
    // prettier-ignore
    script.innerText = (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

    // add the script to the document head
    document.head.appendChild(script);

    // Load the Google Maps places libray
    await google.maps.importLibrary("places");
    // assign the PlacesService to the local global variable
    new google.maps.places.PlacesService(document.createElement("div"));
  } catch (error) {
    console.error(error);
  }
}

/**
 * Adds a new story chapter and saves it to local storage.
 * @param {Chapter} chapter - The chapter object to be added.
 * @returns {void}
 */
export function addChapterToStory(chapter) {
  const chapterIds = story.chapters.map(({ id }) => id);

  // Increment hightest existing chapter id by one. If no chapters exist, set id to 0
  const newChapterId = chapterIds.length ? Math.max(...chapterIds) + 1 : 0;

  // If not specified, the new chapter will have a marker and no focus by default
  const newChapter = {
    focusOptions: {
      focusRadius: null,
      showFocus: false,
      showLocationMarker: true,
    },
    ...chapter,
    id: newChapterId,
  };

  // Add new chapter to story
  story.chapters.push(newChapter);

  // Create chapter marker and add it to the map
  createMarkers([newChapter]);

  // Update details navigation
  updateDetailsNavigation();

  
  const docRef =  addDoc(collection(db, "storytelling-collection"), JSON.stringify(story)); 
  console.log("Camera settings saved with ID: ", docRef.id);
  // Save updated object back to local storage
  localStorage.setItem("story", JSON.stringify(story));
}

/**
 * Returns the updated chapter data from the edit chapter form.
 */
export const getChapterDetails = () => {
  const locationConfigForm = document.querySelector(
    'form[name="edit-chapter-form"]'
  );
  return getFormData(locationConfigForm);
};

/**
 * Returns the updated chapter data from the edit chapter form.
 */
export const getStoryDetails = () => {
  const storyDetailsForm = document.querySelector(
    'form[name="story-details-form"]'
  );
  return getFormData(storyDetailsForm);
};

/**
 * Returns the data of an HTML form element in form of an object.
 *
 * @param {HTMLFormElement} form - The HTML form element to get the data from.
 * @returns {Object} The form data as object.
 */
const getFormData = (form) => {
  const formData = new FormData(form);

  return Array.from(formData.keys()).reduce((result, key) => {
    const inputType = form.querySelector(`input[name="${key}"]`).type;
    // Handle numeric input values
    const isNumericValue = inputType === "number" || inputType === "range";
    const value = isNumericValue
      ? Number(formData.get(key))
      : formData.get(key);

    if (key.includes(".")) {
      // Handle object data with dot-separated keys
      // e.g. "my.nested.keys" results in {my: {nested: {keys: ...}}}
      const [objectKey, ...nestedKeys] = key.split(".");

      const setNestedProperty = (object, properties, value) => {
        const [property, ...nestedProperties] = properties;
        return {
          ...object,
          [property]: nestedProperties.length
            ? setNestedProperty(nestedProperties, value)
            : value,
        };
      };

      result[objectKey] = setNestedProperty(
        result[objectKey] || {},
        nestedKeys,
        value
      );
    } else if (result[key]) {
      // Combine the values of inputs with the same name as array
      result[key] = formData.getAll(key);
    } else {
      result[key] = value;
    }

    return result;
  }, {});
};

/**
 * Proxy handler for handling get, set and delete operations on story object.
 * @type {ProxyHandler}
 */
export const storyProxyHandler = {
  /**
   * Retrieves the value of a property from the target object.
   * If the value is an object, it creates a new Proxy for that object.
   * @param {Object} target - The target object.
   * @param {string} key - The key of the property to retrieve.
   */
  get(target, key) {
    const value = target[key];
    if (typeof value === "object" && value !== null) {
      return new Proxy(value, {
        ...storyProxyHandler,
        parent: target, // Pass the parent object to the proxy handler as a property (used to access the parent object in the set handler)
      });
    }
    return value;
  },

  /**
   * Sets the updated value of a property on the target object.
   * @param {Object} target - The target object.
   * @param {string} property - The key to set the value for.
   * @returns {boolean} - Returns true if the value was successfully set.
   */
  set(target, property, updatedValue) {
    // Check if the property is the length property
    // If so, return true to ignore changes to the length property (for example when adding a new chapter)
    if (property === "length") {
      return true;
    }

    if (Array.isArray(target)) {
      const isNewChapter = !target.includes(updatedValue.id);

      if (isNewChapter) {
        // Add new chapter to story
        target.push(updatedValue);

        // Add card elements to the bar container
        const cardsContainer = document.querySelector(".cards");

        const chapterCard = createChapterCard(updatedValue);
        cardsContainer.appendChild(chapterCard);

        // Add new location tile to the location list
        const locationListContainer = document.querySelector(".location-list");
        locationListContainer.append(createLocationItem(updatedValue));

        // Todo: Refactor initDragAndDrop and createEditMenus to be called only once
        // Initialize drag and drop with new chapter tile
        initDragAndDrop();

        // Create edit menus
        createEditMenus();
        return true;
      }
    }

    // Check if changed property is a chapter property
    if (chapterProperties.includes(property)) {
      if (property === "radius") {
        const radius = updatedValue;
        const coords = target.coords;
        target.focusOptions.focusRadius = radius;
        createCustomRadiusShader(coords, radius);

        return true;
      }

      if (property === "showFocus") {
        const showFocus = updatedValue;

        if (showFocus === true) {
          // If no radius is set yet, use default radius
          if (!target.focusRadius) {
            target.focusRadius = DEFAULT_HIGHLIGHT_RADIUS;
          }

          const radius = target.focusRadius;
          const coords = this.parent.coords; // Get the parent object (chapter) and access its coords property

          createCustomRadiusShader(coords, radius);
        } else {
          removeCustomRadiusShader();
        }
        target.showFocus = showFocus;
        return true;
      }

      if (property === "showLocationMarker") {
        const showLocationMarker = updatedValue;
        const markerId = this.parent.id; // Get the parent object (chapter) and access its id property

        if (showLocationMarker) {
          showMarker(markerId);
        } else {
          hideMarker(markerId);
        }

        target.showLocationMarker = showLocationMarker;

        return true;
      }

      // Update the value
      target[property] = updatedValue;

      // Update chapter card
      updateChapterCard(target, property, updatedValue);

      // Update chapter details
      updateChapterContent(target, false);

      // Update location list item
      if (property === "title") {
        updateLocationListItem(target.id, updatedValue);
      }
    }

    // Update the value
    target[property] = updatedValue;

    // Check if changed property is the chapters array
    // If so, we return here because we updated the chapter order after drag and drop
    if (property === "chapters") {
      return true;
    }

    if (property === "properties") {
      // Update chapter details
      updateChapterContent(target.properties);

      // Update story card
      updateStoryCard(target.properties);
    }

    return true;
  },

  /**
   * Deletes a property from the chapter object and updates the UI accordingly.
   *
   * @param {Array} chapters - The chapter object from which the property will be deleted.
   * @param {string} deletedChapterId - The id of the property to be deleted.
   * @returns {boolean} - Returns true if the property was successfully deleted.
   */
  deleteProperty(chapters, deletedChapterId) {
    // Find index of chapter to be deleted
    const deletedChapterIndex = getChapterIndexFromId(deletedChapterId);
    // Remove chapter from story
    chapters.splice(deletedChapterIndex, 1);

    // We need to update the UI
    // Instead of re-rendering the whole UI, we can just remove the deleted chapter from the location list and chapters bar

    // Remove chapter from location list
    deleteLocationListItem(deletedChapterId);

    // Remove chapter from chapters bar
    deleteChapterCard(deletedChapterId);

    // Remove chapter marker from map
    removeMarker(deletedChapterId);

    // Update details navigation
    updateDetailsNavigation();

    resetToIntro();

    return true;
  },
};

/**
 * Deletes a chapter card from the DOM.
 *
 * @param {string} deletedChapterId - The ID of the chapter card to be deleted.
 */
function deleteChapterCard(deletedChapterId) {
  // Get cards container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Get card to be deleted
  const card = cardsContainer.querySelector(`.card[id="${deletedChapterId}"]`);

  // Remove card
  cardsContainer.removeChild(card);
}

/**
 * Deletes a location list item from the DOM.
 *
 * @param {string} deletedChapterId - The ID of the chapter to be deleted.
 */
function deleteLocationListItem(deletedChapterId) {
  // Get location list container
  const locationListContainer = document.querySelector(".location-list");

  // Get location list item to be deleted
  const locationListItem = locationListContainer.querySelector(
    `.location-list-item[id="${deletedChapterId}"]`
  );

  // Remove location list item
  locationListContainer.removeChild(locationListItem);
}

/**
 * Updates the chapter card with the specified target, property, and updated value.
 * @param {HTMLElement} target - The target element.
 * @param {string} property - The property to be updated.
 * @param {string} updatedValue - The updated value.
 */
function updateChapterCard(target, property, updatedValue) {
  // Get cards container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Get card to be updated
  const card = cardsContainer.querySelector(`.card[id="${target.id}"]`);

  if (!card) {
    return;
  }

  // Get element to be updated
  const element = card.querySelector(`[data-input-name="${property}"]`) || null;

  if (!element) {
    return;
  }

  // Update element

  // Check if element is an image
  // If so, update the src attribute
  // Otherwise, update the text content
  if (property === "imageUrl") {
    const mediaSource = getPreviewUrl(updatedValue) ?? null;

    element.src = mediaSource;
  } else {
    element.textContent = updatedValue;
  }
}

/**
 * Updates the value of a location list item.
 *
 * @param {string} targetId - The target location list item id to be updated.
 * @param {string} updatedValue - The updated value to be set.
 */
function updateLocationListItem(targetId, updatedValue) {
  // Get location list container
  const locationListContainer = document.querySelector(".location-list");

  // Get location list item to be updated
  const locationListItem = locationListContainer.querySelector(
    `.location-list-item[id="${targetId}"]`
  );

  // Get element to be updated
  const element = locationListItem.querySelector("p");

  // Update element
  element.textContent = updatedValue;
}

/**
 * Updates the story details card with the provided values.
 *
 * @param {Object} updatedValues - The updated values for the story card.
 * @param {string} updatedValues.imageUrl - The URL of the image to be displayed in the card.
 * @param {string} updatedValues.title - The title of the card.
 */
function updateStoryCard(updatedValues) {
  // Get cards container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Update the intro card
  const card = cardsContainer.querySelector(`.story-intro`);

  // Update headline in intro-card
  const headline = card.querySelector("h1");

  // Update img in intro-card
  const img = card.querySelector("img");
  img.src = getPreviewUrl(updatedValues.imageUrl);

  headline.textContent = updatedValues.title;
}
