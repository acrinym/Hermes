// src/react/utils/browserApi.ts
// Friendly wrapper around the browser API that falls back to Firefox's `browser`.
// Uses a Proxy so tests can inject globals after import.

export const browserApi: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const api = (globalThis as any).chrome || (globalThis as any).browser || {};
      return api[prop as any];
    }
  }
);
