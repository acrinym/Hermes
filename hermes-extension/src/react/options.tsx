import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AffirmationToggle } from './lib/components';
import { themeOptions } from './themes/themeOptions';
import { exportData, importData } from './services/storageService';
import { browserApi } from './utils/browserApi';

// Assuming ThemeInfo is defined elsewhere, for example:
// interface ThemeInfo {
//   name: string;
//   emoji: string;
//   // ... other theme properties
// }

const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';

function OptionsApp() {
  const [builtIn, setBuiltIn] = useState<any>({});
  const [custom, setCustom] = useState<any>({});
  const [current, setCurrent] = useState('dark');

  useEffect(() => {
    // Using browserApi from the 'main' branch for cleaner API access
    browserApi.storage.local.get([THEME_KEY, CUSTOM_THEMES_KEY, 'hermes_built_in_themes'], (data: any) => {
      const builtin = data.hermes_built_in_themes ? JSON.parse(data.hermes_built_in_themes) : {};
      const customThemes = data[CUSTOM_THEMES_KEY] ? JSON.parse(data[CUSTOM_THEMES_KEY]) : {};
      setBuiltIn(builtin);
      setCustom(customThemes);
      setCurrent(data[THEME_KEY] || 'dark');
    });
  }, []);

  const saveTheme = (val: string) => {
    setCurrent(val);
    // Using browserApi
    browserApi.storage.local.set({ [THEME_KEY]: val });
  };

  const exportThemes = () => {
    // Using browserApi
    browserApi.storage.local.get([CUSTOM_THEMES_KEY], (data: any) => {
      const blob = new Blob([data[CUSTOM_THEMES_KEY] || '{}'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hermes-themes.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const importThemes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        // Using browserApi
        browserApi.storage.local.set({ [CUSTOM_THEMES_KEY]: JSON.stringify(obj) }, () => setCustom(obj));
      } catch (err) {
        console.error('Invalid theme JSON', err);
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = (files: FileList | null) => {
    // This function comes from storageService and likely handles its own logic
    importData(files);
  };

  const allThemes = { ...themeOptions, ...custom, ...builtIn } as Record<string, any>; // Used 'any' for ThemeInfo since it's not defined here

  return (
    <div>
      <h1>Hermes Options</h1>
      
      {/* --- UI from the 'main' branch --- */}
      <AffirmationToggle />

      <hr style={{ margin: '20px 0' }} />

      {/* --- UI from the 'codex' branch --- */}
      <h2>Theme Management</h2>
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
        <input id="importFile" type="file" accept="application/json" style={{ display: 'none' }} onChange={importThemes} />
        <button onClick={() => document.getElementById('importFile')!.click()} id="importThemes">Import Themes</button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* --- UI from the 'codex' branch --- */}
      <h2>Data Management</h2>
      <div>
        <button onClick={exportData} id="exportData">Export Data</button>
        <input id="importDataFile" type="file" accept="application/json" style={{ display: 'none' }} onChange={e => handleImportData(e.target.files)} />
        <button onClick={() => document.getElementById('importDataFile')!.click()} id="importData">Import Data</button>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<OptionsApp />);