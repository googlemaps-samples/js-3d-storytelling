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
 * Loads an SVG icon from the specified icon name.
 *
 * @param {string} iconName - The name of the icon to load.
 * @return {Promise<string>} The SVG string representation of the loaded icon.
 */ export async function loadSvg(iconName) {
  const url = `assets/icons/${iconName}.svg`;
  const parser = new DOMParser();

  const response = await fetch(url);
  const svgString = await response.text();
  const element = parser.parseFromString(
    svgString,
    "image/svg+xml"
  ).documentElement;
  return element.outerHTML;
}
