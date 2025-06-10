const themes: Record<string, Record<string, string>> = {
    light: {
        '--hermes-bg': '#f8f9fa',
        '--hermes-text': '#212529'
    },
    dark: {
        '--hermes-bg': '#2c2c2c',
        '--hermes-text': '#e0e0e0'
    },
    phoenix: {
        '--hermes-bg': '#ffe8e8',
        '--hermes-text': '#b33'
    },
    forest: {
        '--hermes-bg': '#234d20',
        '--hermes-text': '#e7ffe7'
    },
    neon: {
        '--hermes-bg': '#000',
        '--hermes-text': '#39ff14'
    }
};

export function applyTheme(name: string) {
    const vars = themes[name] || themes.dark;
    const style = document.getElementById('hermes-theme-style') || document.createElement('style');
    style.id = 'hermes-theme-style';
    let css = ':root{';
    Object.entries(vars).forEach(([k,v]) => { css += `${k}:${v};`; });
    css += '}';
    style.textContent = css;
    document.head.appendChild(style);
}
