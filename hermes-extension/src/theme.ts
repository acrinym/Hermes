import { themes } from './themeDefs.ts';
import { themeOptions } from './themeOptions.ts';
import { getRoot } from './root.ts';

export function applyTheme(name: string) {
    const vars = themes[name] || themes['dark'];
    const root = getRoot();
    let style: HTMLStyleElement | null;
    if (root instanceof ShadowRoot) {
        style = root.getElementById('hermes-theme-style') as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement('style');
            style.id = 'hermes-theme-style';
            root.appendChild(style);
        }
        let css = ':host{';
        Object.entries(vars).forEach(([k, v]) => { css += `${k}:${v};`; });
        css += '}';
        style.textContent = css;
    } else {
        style = document.getElementById('hermes-theme-style') as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement('style');
            style.id = 'hermes-theme-style';
            document.head.appendChild(style);
        }
        let css = ':root{';
        Object.entries(vars).forEach(([k, v]) => { css += `${k}:${v};`; });
        css += '}';
        style.textContent = css;
    }
}

export function getThemeOptions() {
    return themeOptions;
}
