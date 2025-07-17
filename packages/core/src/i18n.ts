let translator: (key: string, vars?: Record<string, any>) => string = (key, vars = {}) => {
  let str = key;
  Object.keys(vars).forEach(k => {
    str = str.replace(new RegExp(`{${k}}`, 'g'), String(vars[k]));
  });
  return str;
};

export function setTranslationFunction(fn: (key: string, vars?: Record<string, any>) => string) {
  translator = fn;
}

export function t(key: string, vars: Record<string, any> = {}): string {
  return translator(key, vars);
}
