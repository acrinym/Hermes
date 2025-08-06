declare const chrome: any;
declare const browser: any;

function getBrowser() {
  return typeof chrome !== 'undefined'
    ? chrome
    : typeof browser !== 'undefined'
    ? browser
    : undefined;
}

const browserApi = new Proxy(
  {},
  {
    get(_target, prop) {
      const api = getBrowser();
      const value = api && (api as any)[prop];
      return typeof value === 'function' ? value.bind(api) : value;
    }
  }
) as any;

export default browserApi;
