export function getParams() {
  return new URLSearchParams(window.location.hash.replace("#", ""));
}

/**
 * Sets overrides for the configuration data as URL hash parameters.
 * If the passed value is `undefined`, the given parameter will be removed from the URL.
 *
 * @param {string} parameter - The name of the URL hash parameter to set.
 * @param {string | number | Array<string | number> | undefined} value - The value of the URL hash parameter to set.
 */
export const setParams = (parameter, value) => {
  const params = getParams();

  if (value) {
    if (Array.isArray(value)) {
      // Delete array parameter values and add new array values
      params.delete(parameter);
      for (let index = 0; index < value.length; index++) {
        params.append(parameter, value[index]);
      }
    } else {
      // Override parameter value
      params.set(parameter, value);
    }
  } else {
    // Remove parameter value
    params.delete(parameter);
  }

  window.location.hash = params;
};
