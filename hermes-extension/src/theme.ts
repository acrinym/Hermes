import { themes } from './themeDefs.ts';
import { themeOptions } from './themeOptions.ts';

export function applyTheme(name: string) {
    const vars = themes[name] || themes['dark'];
    const style = document.getElementById('hermes-theme-style') || document.createElement('style');
    style.id = 'hermes-theme-style';
    let css = ':root{';
    Object.entries(vars).forEach(([k,v]) => { css += `${k}:${v};`; });
    css += '}';
    style.textContent = css;
    document.head.appendChild(style);
}

export function getThemeOptions() {
    return themeOptions;
}
