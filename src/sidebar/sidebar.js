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
 * Initializes the autocomplete functionality for the location input field.
 * @returns {Promise<void>} A promise that resolves when the autocomplete is initialized.
 */
export async function initAutoComplete() {
  const locationInput = document.querySelector(".locations-container input");

  // Todo: get correct fields
  const options = { fields: ["geometry"] };
  const autocomplete = new google.maps.places.Autocomplete(
    locationInput,
    options
  );

  // Listen to location changes
  autocomplete.addListener("place_changed", () => {
    const selectedPlace = autocomplete.getPlace();

    // Catch user pressed enter key without selecting a place in the list
    if (!selectedPlace.geometry) {
      return;
    }
    // Todo: do something with the location
    const { location } = selectedPlace.geometry;
  });
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

// Add event listener to all details elements in the sidebar
const details = document.querySelectorAll("#sidebar > details");

// A reference to the abort controller used to cancel the events on dialog close
let dialogEventController;
let currentDialog = null;

details.forEach((section) => {
  section.addEventListener("toggle", toggleDetailsSection);
});
// Cache all dialog show buttons
const dialogShowButtons = document.querySelectorAll("dialog + button");

// Add event listener to all dialog show buttons
dialogShowButtons.forEach((button) => {
  const dialog = button.previousElementSibling;
  button.addEventListener("click", (event) => {
    if (currentDialog) {
      closeDialog(currentDialog);
    }
    event.stopPropagation();
    currentDialog = dialog;
    dialog.show();
    createDialogCloseListeners(dialog);
  });
});

/**
 * Creates event listeners for closing a dialog.
 * @param {HTMLElement} dialog - The dialog element to be closed.
 */
function createDialogCloseListeners(dialog) {
  dialogEventController = new AbortController();

  document.addEventListener(
    "keydown",
    (event) => {
      const { key } = event;
      if (key === "Escape" && dialog) {
        closeDialog(dialog);
      }
    },
    { signal: dialogEventController.signal }
  );

  document.addEventListener(
    "click",
    (event) => {
      const { target } = event;
      if (!dialog.contains(target)) {
        closeDialog(dialog);
      }
    },
    { signal: dialogEventController.signal }
  );
}

// Helper function to close the dialog and aborts any ongoing event listeners
function closeDialog(dialog) {
  dialog.close();
  dialogEventController.abort();
  currentDialog = null;
}
