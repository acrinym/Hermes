/**
 * @file theme.ts (Merged)
 * @description A single, self-contained TypeScript script for applying themes.
 * This script merges the Shadow DOM support from the 'refactor' branch with the
 * extensive theme definitions and styles from the 'main' branch, with all
 * necessary functions included directly in this file.
 */

// --- UTILITY FUNCTIONS (Included directly in the script) ---

/**
 * Converts a string of RGB values into a hex color code.
 * e.g., "255 255 255" becomes "#ffffff".
 * This function was required by themes in the 'main' branch.
 * @param rgbString A string containing three space-separated number values.
 * @returns The hex color string.
 */
function rgbStringToHex(rgbString: string): string {
  const parts = rgbString.split(' ').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`Invalid RGB string provided: "${rgbString}"`);
    return '#000000'; // Return a default/error color
  }
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const [r, g, b] = parts;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Determines the root element where styles should be applied.
 * It checks for a specific UI container with a Shadow DOM first,
 * and falls back to the main document if not found.
 * This function was originally an import in the 'refactor' branch.
 * @returns The ShadowRoot if it exists, otherwise the main Document.
 */
function getRoot(): Document | ShadowRoot {
  // A common pattern is to have a single container for the UI.
  // We check if that container exists and is using a Shadow DOM.
  const hermesUIContainer = document.getElementById('hermes-ui-container');
  if (hermesUIContainer && hermesUIContainer.shadowRoot) {
    return hermesUIContainer.shadowRoot;
  }
  // Otherwise, we fall back to the main document.
  return document;
}

// Assuming 'themes' is defined in this file or imported correctly
import { themes } from './themeDefs';

// — Theme Name Array —
export const themeNames = Object.keys(themes);

// — Theme Option Dropdown (Label Beautifier) —
/**
 * An array of theme options suitable for use in a dropdown menu.
 */
export const themeOptions = Object.keys(themes).map(name => ({
  value: name,
  label: name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}));

let systemMedia: MediaQueryList | null = null;
let systemHandler: ((e: MediaQueryListEvent) => void) | null = null;

function applyVars(themeName: string) {
  const vars = themes[themeName] || themes['dark'];
  const root = getRoot();
  let style: HTMLStyleElement | null;

  const additionalCss = `
    .hermes-button {
      background: var(--hermes-button-bg);
      color: var(--hermes-button-text);
      border: 1px solid var(--hermes-border);
      border-radius: 4px;
      padding: 4px 6px;
      cursor: pointer;
      transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }
    .hermes-button:hover {
      background: var(--hermes-button-hover-bg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transform: translateY(-1px);
    }
    #hermes-ui-container, #hermes-minimized-container {
      border: 1px solid var(--hermes-border);
    }
    #hermes-ui-container.hermes-bunched {
      flex-direction: column;
    }
  `;

  const variablesCss = Object.entries(vars).reduce((acc, [key, value]) => `${acc}${key}:${value};`, '');

  if (root instanceof ShadowRoot) {
    style = root.getElementById('hermes-theme-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'hermes-theme-style';
      root.appendChild(style);
    }
    style.textContent = `:host{${variablesCss}} ${additionalCss}`;
  } else {
    style = document.getElementById('hermes-theme-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'hermes-theme-style';
      document.head.appendChild(style);
    }
    style.textContent = `:root{${variablesCss}} ${additionalCss}`;
  }
}

/**
 * Applies a theme by injecting CSS variables into the document head or a Shadow DOM root.
 * This function should combine shadow DOM logic with optional component styling.
 * @param name The name of the theme to apply (e.g., 'dark', 'phoenix', 'system').
 */
export function applyTheme(name: string) {
  if (name === 'system') {
    if (!systemMedia) {
      systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
      systemHandler = (e: MediaQueryListEvent) => applyVars(e.matches ? 'dark' : 'light');
      systemMedia.addEventListener('change', systemHandler);
    }
    applyVars(systemMedia.matches ? 'dark' : 'light');
    return;
  }

  if (systemMedia && systemHandler) {
    systemMedia.removeEventListener('change', systemHandler);
    systemMedia = null;
    systemHandler = null;
  }

  applyVars(name);
}

/**
 * Returns the available theme options, allowing a UI to build a theme selector.
 * This function was originally an import in the 'refactor' branch.
 * @returns An array of objects with 'value' and 'label' for each theme.
 */
export function getThemeOptions() {
  return themeOptions;
}
