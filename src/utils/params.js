/**
 * Retrieves the parameters from the URL hash.
 *
 * @return {URLSearchParams} The URLSearchParams object containing the parameters.
 */
export function getParams() {
  return new URLSearchParams(window.location.hash.replace("#", ""));
}
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * Sets overrides for the configuration data as URL hash parameters.
 * If the passed value is `undefined`, the given parameter will be removed from the URL.
 *
 * @param {string} parameter - The name of the URL hash parameter to set.
 * @param {string | number | Array<string | number> | undefined} value - The value of the URL hash parameter to set.
 */
export const setParams = (parameter, value) => {
  const params = getParams();

  if (value !== null && value !== undefined) {
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
