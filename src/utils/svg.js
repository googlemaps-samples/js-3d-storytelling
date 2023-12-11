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
