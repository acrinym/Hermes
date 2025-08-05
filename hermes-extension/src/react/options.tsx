import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AffirmationToggle } from './lib/components';
import { themeOptions } from './themes/themeOptions';

declare const chrome: any;

const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';

interface ThemeInfo {
  name: string;
  emoji: string;
}

function OptionsApp() {
  const [builtIn, setBuiltIn] = useState<Record<string, ThemeInfo>>({});
  const [custom, setCustom] = useState<Record<string, ThemeInfo>>({});
  const [current, setCurrent] = useState('dark');

  useEffect(() => {
    chrome.storage.local.get([THEME_KEY, CUSTOM_THEMES_KEY, 'hermes_built_in_themes'], (data: any) => {
      const builtin = data.hermes_built_in_themes ? JSON.parse(data.hermes_built_in_themes) : {};
      const customThemes = data[CUSTOM_THEMES_KEY] ? JSON.parse(data[CUSTOM_THEMES_KEY]) : {};
      setBuiltIn(builtin);
      setCustom(customThemes);
      setCurrent(data[THEME_KEY] || 'dark');
    });
  }, []);

  const saveTheme = (val: string) => {
    setCurrent(val);
    chrome.storage.local.set({ [THEME_KEY]: val });
  };

  const exportThemes = () => {
    chrome.storage.local.get([CUSTOM_THEMES_KEY], (data: any) => {
      const blob = new Blob([data[CUSTOM_THEMES_KEY] || '{}'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hermes-themes.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const importThemes = (files: FileList | null) => {
    if (!files || !files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        chrome.storage.local.set({ [CUSTOM_THEMES_KEY]: JSON.stringify(obj) }, () => setCustom(obj));
      } catch (e) {
        console.error('Invalid theme JSON', e);
      }
    };
    reader.readAsText(files[0]);
  };

  const allThemes = { ...themeOptions, ...custom, ...builtIn } as Record<string, ThemeInfo>;

  return (
    <div>
      <h1>Hermes Options</h1>
      <label>
        Theme:
        <select value={current} onChange={e => saveTheme(e.target.value)} id="themeSelect">
          {Object.keys(allThemes).map(key => (
            <option key={key} value={key}>
              {allThemes[key].emoji} {allThemes[key].name}
            </option>
          ))}
        </select>
      </label>
      <div>
        <button onClick={exportThemes} id="exportThemes">Export Themes</button>
        <input id="importFile" type="file" accept="application/json" style={{ display: 'none' }} onChange={e => importThemes(e.target.files)} />
        <button onClick={() => document.getElementById('importFile')!.click()} id="importThemes">Import Themes</button>
      </div>
      <AffirmationToggle />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<OptionsApp />);
}

export { OptionsApp };
