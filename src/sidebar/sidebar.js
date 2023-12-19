import {
  updateChapter,
  resetToIntro,
  getChapterIndexFromId,
} from "../chapters/chapter-navigation.js";
import { createMarkers, removeMarker } from "../utils/create-markers.js";
import { getParams } from "../utils/params.js";
import {
  getCameraOptions,
  calculateCameraPositionAndOrientation,
  performFlyTo,
  DEFAULT_HIGHLIGHT_RADIUS,
} from "../utils/cesium.js";
import { story } from "../main.js";
import { getStoryDetails, addChapterToStory } from "../utils/config.js";
import { getPreviewUrl } from "../utils/ui.js";
import { removeCustomRadiusShader } from "../utils/cesium.js";

/**
 * Options for radio buttons in the sidebar.
 * @typedef {Object} LocationMenuOptions
 * @property {'edit'} edit - Option for editing.
 * @property {'delete'} delete - Option for deleting.
 */

/**
 * @type {LocationMenuOptions} - Options for radio buttons in the sidebar.
 */
const locationMenuOptions = {
  edit: "edit",
  delete: "delete",
};

/**
 * Adds a click event listener to the sidebar toggle button, toggling the "sidebar-is-collapsed" class
 * on the main container when the button is clicked.
 */
export function addSidebarToggleHandler() {
  const sidebarToggle = document.querySelector(".sidebar-collapse-toggle");

  sidebarToggle.addEventListener("click", () => {
    const main = document.querySelector(".main-container");
    main.classList.toggle("sidebar-is-collapsed");
  });
}

/**
 * Updates the places in the sidebar based on the given chapters.
 */
export function updateSidebar() {
  const { chapters, properties } = story;
  // Fill story details form with the properties data
  updateStoryDetails(properties);

  // Fill location list with the chapters data
  updateLocationList(chapters);
}

/**
 * Updates the location list with the provided chapters data.
 *
 * @param {Chapter[]} chapters - The chapters data used to populate the location list.
 */
export function updateLocationList(chapters) {
  // Fill the location list with the chapters data
  const locationListContainer = document.querySelector(".location-list");

  locationListContainer.replaceChildren(
    ...chapters.map((chapter) => createLocationItem(chapter))
  );

  // The sidebar enables the user to add or edit new locations to the story.
  // Here we initialize the sidebar functionality.

  // Enable the drag and drop functionality for the location items
  initDragAndDrop();

  // Enable the edit menu for the each location item
  createEditMenus(chapters);
}

/**
 * Updates the story details form with the provided properties data.
 * @param {StoryProperties} properties - The properties data to fill the form with.
 */
function updateStoryDetails(properties) {
  // Fill the story details form with the properties data
  const storyDetailsForm = document.querySelector(
    'form[name="story-details-form"]'
  );

  // Fill the form inputs with the properties data
  storyDetailsForm.querySelector('input[name="title"]').value =
    properties.title ?? null;
  storyDetailsForm.querySelector('input[name="description"]').value =
    properties.description ?? null;
  storyDetailsForm.querySelector('input[name="createdBy"]').value =
    properties.createdBy ?? null;
  storyDetailsForm.querySelector('input[name="date"]').value =
    properties.date ?? null;
  storyDetailsForm.querySelector('input[name="imageUrl"]').value =
    properties.imageUrl ?? null;
  storyDetailsForm.querySelector('input[name="imageCredit"]').value =
    properties.imageCredit ?? null;

  // Update the preview image or video
  const mediaSource = getPreviewUrl(properties.imageUrl) ?? null;
  const storyImage = storyDetailsForm.querySelector(
    ".image-credit-container img"
  );
  storyImage.src = mediaSource ?? "#";
  storyImage.style.visibility = mediaSource ? "visible" : "hidden";

  // Add event listener to save the camera position to story
  document
    .getElementById("save-story-camera-position-button")
    .addEventListener("click", () => {
      story.properties.cameraOptions = getCameraOptions();
      storyDetailsForm.requestSubmit();
    });

  // Add event listener to show info tooltip for saving camera position
  const saveStoryCameraPositionInfoIcon = document.getElementById(
    "save-story-camera-position-info-icon"
  );
  const saveStoryCameraPositionInfoText = document.getElementById(
    "save-story-camera-position-info-tooltip"
  );
  saveStoryCameraPositionInfoIcon.addEventListener("mouseover", () => {
    saveStoryCameraPositionInfoText.style.display = "initial";
  });
  saveStoryCameraPositionInfoIcon.addEventListener("mouseleave", () => {
    saveStoryCameraPositionInfoText.style.display = "none";
  });

  // In the story details form, the user can change the story properties.
  // As there is no submit button, we submit the form when the user changes an input.
  storyDetailsForm.addEventListener("input", () => {
    const params = getParams();

    const isIntroSelected = Boolean(!params.get("chapterId"));

    if (!isIntroSelected) {
      resetToIntro();
    }

    storyDetailsForm.requestSubmit();
  });

  // Code for story-details-form submission
  storyDetailsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get updated story details
    const updatedStoryDetails = getStoryDetails();

    // Update story properties
    const updatedStoryProperties = {
      ...story.properties,
      ...updatedStoryDetails,
    };

    // Update story
    story.properties = updatedStoryProperties;

    // update the preview image or video
    const mediaSource = getPreviewUrl(story.properties.imageUrl) ?? null;
    storyImage.src = mediaSource ?? "#";
    storyImage.style.visibility = mediaSource ? "visible" : "hidden";

    // Save updated object back to local storage
    localStorage.setItem("story", JSON.stringify(story));
  });
}

/**
 * Creates a location item element for a given chapter.
 *
 * @param {Chapter} chapter - The chapter object containing the title.
 * @returns {HTMLElement} - The created location item element.
 */
export function createLocationItem(chapter) {
  // Create elements
  const li = document.createElement("li");
  const p = document.createElement("p");
  const dialog = document.createElement("dialog");
  const form = document.createElement("form");
  const fieldset = document.createElement("fieldset");
  const button = document.createElement("button");
  const img = document.createElement("img");

  // Set attributes and content
  li.className = "location-list-item";
  li.draggable = true;
  li.id = chapter.id;

  p.textContent = chapter.title;

  form.method = "dialog";
  form.name = "location-menu";
  form.dataset.name = chapter.title;
  form.setAttribute("key", chapter.id);

  Object.values(locationMenuOptions).forEach((option, index) => {
    const input = document.createElement("input");
    const label = document.createElement("label");

    const uniqueId = `${chapter.id}-${option}-${index}`;

    input.setAttribute("key", `${chapter.id}-${index}`);
    input.type = "radio";
    input.id = uniqueId;

    input.name = chapter.title;
    input.value = option;
    input.dataset.name = chapter.title;

    label.htmlFor = uniqueId;
    label.textContent = option.charAt(0).toUpperCase() + option.slice(1);
    label.setAttribute("data-type-edit", option);

    fieldset.appendChild(input);
    fieldset.appendChild(label);
  });

  button.setAttribute("aria-label", "Open Settings");

  img.src = "./assets/icons/location-list-item-hover.svg";
  img.alt = "";

  // Append elements
  button.appendChild(img);
  form.appendChild(fieldset);
  dialog.appendChild(form);
  li.appendChild(p);
  li.appendChild(dialog);
  li.appendChild(button);

  return li;
}

/**
 * Initializes the autocomplete functionality for the location input field.
 */
export function initGeoSuggest() {
  const locationInput = document.querySelector(".locations-container input");

  const options = { fields: ["geometry"] };
  const autocomplete = new google.maps.places.Autocomplete(
    locationInput,
    options
  );

  let coords = null;
  let cameraOptions = null;

  // Listen to location changes
  autocomplete.addListener("place_changed", async () => {
    removeMarker("place-marker");
    const selectedPlace = autocomplete.getPlace();
    removeCustomRadiusShader();

    // Catch user pressed enter key without selecting a place in the list
    if (!selectedPlace?.geometry) {
      locationSubmitButton.disabled = true;
      return;
    }
    coords = selectedPlace.geometry.location.toJSON();
    // Calculate camera position and orientation based on coords
    cameraOptions = await calculateCameraPositionAndOrientation(coords);
    const { position, heading, pitch, roll } = cameraOptions;

    // Fly to calculated position
    performFlyTo({ position, orientation: { heading, pitch, roll } });
    // Create temporary marker on selected location
    createMarkers([{ id: "place-marker", coords }]);

    locationSubmitButton.disabled = false;
  });

  const locationSubmitButton = document.querySelector(".add-location");

  // If input field is empty clear existing location and disable form submission button
  locationInput.addEventListener("input", () => {
    if (locationInput.value === "") {
      removeMarker("place-marker");
      coords = null;
      cameraOptions = null;
      locationSubmitButton.disabled = true;
    }
  });

  // Handle submit location button click
  locationSubmitButton.addEventListener("click", () => {
    // Adds new chapter to story
    addChapterToStory({
      title: locationInput.value,
      coords,
      cameraOptions,
    });

    // Reset input field
    autocomplete.set("place", null);
    locationInput.value = "";
  });
}

/**
 * The currently opened menu dialog.
 * @type {HTMLDialogElement}
 */
let currentOpenedMenu = null;

/**
 * A reference to the abort controller used to cancel the events on dialog close
 * @type {AbortController}
 */
let locationMenuEventController;

/**
 * Creates edit menus for chapters in the sidebar.
 */
export function createEditMenus() {
  const { chapters } = story;
  // Add event listener to all details elements in the sidebar
  const details = document.querySelectorAll("#sidebar > details");

  details.forEach((section) => {
    section.addEventListener("toggle", toggleDetailsSection);
  });

  // Cache all dialog show buttons
  const editMenuShowButtons = document.querySelectorAll("dialog + button");

  // Add event listener to all dialog show buttons
  editMenuShowButtons.forEach((button) => {
    const dialog = button.previousElementSibling;
    button.addEventListener("click", (event) => {
      if (currentOpenedMenu) {
        closeMenu(currentOpenedMenu);
      }
      event.stopPropagation();
      currentOpenedMenu = dialog;
      dialog.show();
      createLocationMenuCloseListeners(dialog);
    });
  });

  // Enable the menu options event listeners
  addEditMenuEventListeners(chapters);
}

/**
 * Toggles the details section based on the event's new state.
 * Closes all other details sections except the one with the specified target ID.
 * @param {Event} event - The event object containing the new state and target ID.
 */
const toggleDetailsSection = (event) => {
  if (event.newState === "open") {
    const details = document.querySelectorAll(
      `details:not(#${event.target.id})`
    );

    details.forEach((detail) => (detail.open = false));
  }
};

/**
 * Creates event listeners for closing a dialog.
 * @param {HTMLElement} dialog - The dialog element to be closed.
 */
function createLocationMenuCloseListeners(dialog) {
  locationMenuEventController = new AbortController();

  // closes the dialog when the escape key is pressed
  document.addEventListener(
    "keydown",
    (event) => {
      const { key } = event;
      if (key === "Escape" && dialog) {
        closeMenu(dialog);
      }
    },
    { signal: locationMenuEventController.signal }
  );

  // closes the dialog when the user clicks outside of the dialog
  document.addEventListener(
    "click",
    (event) => {
      const { target } = event;
      if (!dialog.contains(target)) {
        closeMenu(dialog);
      }
    },
    { signal: locationMenuEventController.signal }
  );
}

/**
 * Helper function to close the dialog and aborts any ongoing event listeners
 * @param {HTMLDialogElement} dialog - The dialog element to be closed.
 */
function closeMenu(dialog) {
  dialog.close();
  locationMenuEventController.abort();
  currentOpenedMenu = null;
}

/**
 * Initializes the draggable location items functionality.
 */
export function initDragAndDrop() {
  // Get all draggable location list items
  const locationItems = document.querySelectorAll(".location-list-item");

  // Get the location list where the items can be dropped
  const locationList = document.querySelector(".location-list");

  // Add event listeners to all draggable items
  locationItems.forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      if (event.target !== item) {
        event.preventDefault();
      } else {
        item.classList.add("dragging");
      }
    });

    item.addEventListener("dragend", (event) => {
      if (event.target !== item) {
        event.preventDefault();
      } else {
        event.stopPropagation();
        item.classList.remove("dragging");
      }
    });
  });

  // Add event listeners to the location list where the items can be dropped
  locationList.addEventListener("dragover", (event) => {
    event.preventDefault();

    const nextElement = getNextElementByVerticalPosition(
      locationList,
      event.clientY
    );
    const draggedItem = document.querySelector(".dragging");
    if (nextElement == null) {
      locationList.appendChild(draggedItem);
    } else {
      locationList.insertBefore(draggedItem, nextElement);
    }
  });

  locationList.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    // Get the id of the dragged location-list-item
    const draggedLocationItemId = event.target.id;

    // Get the id of the location-list-item next which the dragged location-list-item should be inserted
    const nextLocationItemId = event.target.nextSibling?.id ?? null;

    updateChapterBarCards(draggedLocationItemId, nextLocationItemId);
  });
}

/**
 * Updates the chapter bar cards by reordering the chapters based on the dragged and next location items.
 *
 * @param {string} draggedLocationItemId - The ID of the dragged location item.
 * @param {string} nextLocationItemId - The ID of the next location item.
 */
function updateChapterBarCards(draggedLocationItemId, nextLocationItemId) {
  // Get chapter card container
  const cardsContainer = document.querySelector("#chapters-bar .cards");

  // Get the dragged location-chapter
  const targetChapter = cardsContainer.querySelector(
    `.card[id="${draggedLocationItemId}"]`
  );

  // Get the next location-chapter
  const nextChapter = cardsContainer.querySelector(
    `.card[id="${nextLocationItemId}"]`
  );

  // Insert the dragged location-chapter after the next location-chapter
  // If the nextChapter is null, the dragged location-chapter should be inserted at the end of the list
  if (!nextChapter) {
    cardsContainer.appendChild(targetChapter);
  } else {
    cardsContainer.insertBefore(targetChapter, nextChapter);
  }

  // Reorder the chapters
  const reorderedChapters = moveChapter(
    story.chapters,
    draggedLocationItemId,
    nextLocationItemId
  );

  // Update the story object
  story.chapters = reorderedChapters;

  // Save updated object back to local storage
  localStorage.setItem("story", JSON.stringify(story));
}

/**
 * Moves a chapter within an array of chapters.
 *
 * @param {Chapter[]} chapters - The array of chapters.
 * @param {number} draggedLocationItemId - The ID of the dragged chapter.
 * @param {number} nextLocationItemId - The ID of the next sibling of the dragged chapter.
 * @returns {Chapter[]} - The updated array of chapters with the dragged chapter moved to the desired position.
 */
const moveChapter = (chapters, draggedLocationItemId, nextLocationItemId) => {
  // Create shallow copy of original array
  // We do this because we don't want to change the original chapters array yet
  const copiedChapters = chapters.slice();

  // Find the index of the dragged chapter
  const movedChapterIndex = getChapterIndexFromId(draggedLocationItemId);

  // Get the dragged chapter and remove it from the array
  const movedChapter = copiedChapters.splice(movedChapterIndex, 1)[0];

  // Find the index of the chapter where the dragged chapter should be inserted
  // If the nextLocationItemId is null, the dragged chapter should be inserted at the end of the array
  const toIndex = nextLocationItemId
    ? copiedChapters.findIndex(
        (chapter) => Number(chapter.id) === Number(nextLocationItemId)
      )
    : copiedChapters.length;

  if (toIndex === -1) {
    console.warn("Invalid index");
  }

  // Insert the dragged chapter at the correct position
  copiedChapters.splice(toIndex, 0, movedChapter);

  return copiedChapters;
};

/**
 * Finds the element after which a dragged element should be inserted on the y-coordinate of the event.
 *
 * @param {HTMLElement} container - The container element that holds the draggable elements.
 * @param {number} draggedElementPositionY - The vertical position of the dragged element.
 * @returns {HTMLElement} - The element after which the dragged element should be inserted.
 */
function getNextElementByVerticalPosition(container, draggedElementPositionY) {
  const nonDraggedLocationItems = [
    ...container.querySelectorAll(".location-list-item:not(.dragging)"),
  ];

  // Find the element that is closest to the dragged element
  // by comparing the vertical position of the dragged element to the vertical position of the other elements.
  // The element with the smallest offset is the closest element.
  return nonDraggedLocationItems.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = draggedElementPositionY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    // Set initial offset to negative infinity to ensure that the offset is always smaller than the initial value
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

/**
 * Adds a change event listener to each form element with the method attribute set to "dialog".
 * When a radio input is changed, the form is submitted and the dialog is closed.
 * @param {Chapter[]} chapters - An array of chapter objects.
 */
function addEditMenuEventListeners(chapters) {
  const editMenus = document.querySelectorAll('form[name="location-menu"]');
  editMenus.forEach(function (editMenu) {
    // Attach a change event listener to each form
    editMenu.addEventListener("change", function (event) {
      const target = event.target;

      // Check if the changed element is a radio input
      if (target.type === "radio") {
        // Submit the form
        editMenu.requestSubmit();

        // The dialog element is automatically closed when the form is submitted
        // so we need to abort the event listeners here
        locationMenuEventController.abort();
        currentOpenedMenu = null;

        // Reset the edit menu
        editMenu.reset();
      }
    });

    // Attach a submit event listener to each editMenu
    editMenu.addEventListener("submit", function () {
      // Get which radio input was selected
      const selectedAction = editMenu.querySelector(
        'input[type="radio"]:checked'
      ).value;

      // Get which chapter the form belongs to
      const selectedChapterKey = editMenu.getAttribute("key");

      const selectedChapter = chapters.find(
        (chapter) => Number(selectedChapterKey) === Number(chapter.id)
      );

      handleEditMenuSubmit(selectedAction, selectedChapter);
    });
  });
}

/**
 * Handles the submit action of the edit menu.
 *
 * @param {string} action - The action to perform.
 * @param {Chapter} selectedChapter - The selected chapter.
 */
function handleEditMenuSubmit(action, selectedChapter) {
  switch (action) {
    // This case opens the edit form
    case locationMenuOptions.edit:
      handleEditAction(selectedChapter);
      break;

    // This case deletes the chapter
    case locationMenuOptions.delete:
      handleDeleteAction(selectedChapter.id);

      break;
    default:
      console.warn("Invalid option type");
      // Code for handling default case
      break;
  }
  return null;
}

/**
 * A reference to the abort controller used to cancel the events on edit form close
 * @type {AbortController}
 */
let editFormEventController;

/**
 * Handles the edit action for a chapter
 * 1. Opens the edit form
 * 2. Fills the form with the chapter data
 * 3. Submits the form and updates the chapter data
 *
 * @param {Chapter} chapter - The chapter object to be edited.
 */
function handleEditAction(chapter) {
  editFormEventController = new AbortController();

  const container = document.querySelector(".locations-container");

  // Add custom data-attribute to the container
  container.setAttribute("data-mode", locationMenuOptions.edit);

  const editForm = document.querySelector("form[name='edit-chapter-form']");

  // Set which chapter the form belongs to
  editForm.setAttribute("key", chapter.id);

  // Fill the form text inputs with the chapter data
  editForm.querySelector('input[name="title"]').value = chapter.title ?? null;
  editForm.querySelector('input[name="content"]').value =
    chapter.content ?? null;
  editForm.querySelector('input[name="address"]').value =
    chapter.address ?? null;
  editForm.querySelector('input[name="dateTime"]').value =
    chapter.dateTime ?? null;
  editForm.querySelector('input[name="imageUrl"]').value =
    chapter.imageUrl ?? null;
  editForm.querySelector('input[name="imageCredit"]').value =
    chapter.imageCredit ?? null;

  // Update the preview image or video
  const mediaSource = getPreviewUrl(chapter.imageUrl) ?? null;

  const chapterImage = editForm.querySelector(".image-credit-container img");
  chapterImage.src = mediaSource;
  chapterImage.style.visibility = mediaSource ? "visible" : "hidden";

  // Fill the "more settings" form inputs with the chapter data
  // Get the radius input element
  const isFocusEnabled = chapter.focusOptions.showFocus;

  editForm.querySelector('input[name="focus-checkbox"]').checked =
    isFocusEnabled;

  const radiusInput = editForm.querySelector("#radius");

  // Initialize the slider with the current radius from the chapter
  radiusInput.value =
    chapter.focusOptions.focusRadius ?? DEFAULT_HIGHLIGHT_RADIUS;
  radiusInput.style.setProperty("--value", radiusInput.value);

  // Update the slider progress when the value changed
  radiusInput.addEventListener(
    "input",
    () => {
      radiusInput.style.setProperty("--value", radiusInput.value);
    },
    { signal: editFormEventController.signal }
  );

  const isMarkerVisible = chapter.focusOptions.showLocationMarker;

  editForm.querySelector('input[name="marker-checkbox"]').checked =
    isMarkerVisible;

  const selectedChapterKey = editForm.getAttribute("key");

  const selectedChapter = story.chapters.find(
    (chapter) => Number(selectedChapterKey) === Number(chapter.id)
  );

  // Update chapter when opening edit form
  updateChapter(getChapterIndexFromId(selectedChapterKey));

  // Add event listener to save the camera position to chapter
  document
    .getElementById("save-chapter-camera-position-button")
    .addEventListener(
      "click",
      () => (selectedChapter.cameraOptions = getCameraOptions()),
      { signal: editFormEventController.signal }
    );

  // Add event listener to show info tooltip for saving camera position
  const saveChapterCameraPositionInfoIcon = document.getElementById(
    "save-chapter-camera-position-info-icon"
  );
  const saveChapterCameraPositionInfoText = document.getElementById(
    "save-chapter-camera-position-info-tooltip"
  );
  saveChapterCameraPositionInfoIcon.addEventListener("mouseover", () => {
    saveChapterCameraPositionInfoText.style.display = "initial";
  });
  saveChapterCameraPositionInfoIcon.addEventListener("mouseleave", () => {
    saveChapterCameraPositionInfoText.style.display = "none";
  });

  // Add event listener that listens to changes to the chapter properties
  editForm.addEventListener(
    "input",
    (event) => {
      const { name, value, type, checked } = event.target;

      if (type === "checkbox") {
        if (name === "focus-checkbox") {
          selectedChapter.focusOptions.showFocus = checked;
        }

        if (name === "marker-checkbox") {
          selectedChapter.focusOptions.showLocationMarker = checked;
        }
        return;
      }

      if (name === "imageUrl") {
        const mediaSource = getPreviewUrl(value) ?? null;
        chapterImage.src = mediaSource;
        chapterImage.style.visibility = mediaSource ? "visible" : "hidden";
      }

      selectedChapter[name] = value;
    },
    { signal: editFormEventController.signal }
  );

  // Code for edit-from submission
  // The form is submitted when the user clicks the leave-edit-mode button
  editForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      localStorage.setItem("story", JSON.stringify(story));

      editFormEventController.abort();

      container.removeAttribute("data-mode");
    },

    // Remove the event listener after the submit
    { once: true }
  );
}

/**
 * Handles the delete action for a chapter.
 * Removes the chapter with the specified id from the story,
 * updates the localStorage and updates the UI.
 *
 * @param {number} id - The id of the chapter to be deleted.
 */
function handleDeleteAction(id) {
  delete story.chapters[id];
  // Save updated object back to local storage
  localStorage.setItem("story", JSON.stringify(story));
}

/**
 * Adds a click event handler to the "download-config-button" element.
 * When the button is clicked, this function generates a Blob containing
 * the JSON representation of the 'story' object and triggers a file download
 * for the configuration.
 */
export function addDownloadConfigHandler() {
  document
    .getElementById("download-config-button")
    .addEventListener("click", () => {
      const anchor = document.createElement("a");

      // Create a Blob containing the JSON representation of the 'story' object
      const blob = new Blob([JSON.stringify(story)], {
        type: "text/json;charset=utf-8",
      });
      // Create a URL for the Blob
      const blobUrl = URL.createObjectURL(blob);

      // Set up the anchor element for download
      anchor.href = blobUrl;
      anchor.target = "_blank";
      anchor.download = "config.json";

      // Auto click on the anchor element, triggering the file download
      anchor.click();

      // Revoke the Blob URL to free up resources
      URL.revokeObjectURL(blobUrl);
    });
}
