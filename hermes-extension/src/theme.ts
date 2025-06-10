const themes: Record<string, Record<string, string>> = {
    light: {
        '--hermes-bg': '#f8f9fa',
        '--hermes-text': '#212529'
    },
    dark: {
        '--hermes-bg': '#2c2c2c',
        '--hermes-text': '#e0e0e0'
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
