// src/react/utils/browserApi.ts

/**
 * A proxy-based wrapper for browser extension APIs.
 * This approach gracefully handles differences between Chrome's `chrome` object
 * and Firefox's `browser` object.
 *
 * The Proxy dynamically looks up properties on the available global object
 * (`chrome` or `browser`) at runtime. This is more robust than a static check.
 *
 * Crucially, it also binds the correct `this` context to any function returned,
 * which is required for many extension APIs to work correctly.
 */

// A helper function to get the correct browser API object from the global scope.
function getBrowserApiObject(): any {
  // Use globalThis for a universal way to access the global object.
  // Check for `chrome` first, as some browsers support both.
  if (typeof globalThis.chrome !== 'undefined') {
    return globalThis.chrome;
  }
  // Fallback to `browser` for Firefox and other compatible browsers.
  if (typeof globalThis.browser !== 'undefined') {
    return globalThis.browser;
  }
  // Return an empty object if no API is found to prevent errors.
  return {};
}

export const browserApi: any = new Proxy(
  {}, // The proxy target is an empty object.
  {
    get(_target, prop) {
      const api = getBrowserApiObject();
      
      // Get the requested property (e.g., 'runtime', 'storage') from the API object.
      const value = api[prop as any];

      // If the property is a function, we must bind it to the API object.
      // Otherwise, calls to it will fail because `this` will be undefined.
      if (typeof value === 'function') {
        return value.bind(api);
      }
      
      // If it's not a function, just return the value as is.
      return value;
    },
  }
);