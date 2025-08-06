import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AffirmationToggle } from './lib/components';
import { themeOptions } from './themes/themeOptions';
import { browserApi } from './utils/browserApi';

const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';

function OptionsApp() {
  const [builtIn, setBuiltIn] = useState<any>({});
  const [custom, setCustom] = useState<any>({});
  const [current, setCurrent] = useState('dark');

  useEffect(() => {
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
    browserApi.storage.local.set({ [THEME_KEY]: val });
  };

  const exportThemes = () => {
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
        browserApi.storage.local.set({ [CUSTOM_THEMES_KEY]: JSON.stringify(obj) }, () => setCustom(obj));
      } catch (e) {
        console.error('Invalid theme JSON', e);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h1>Hermes Options</h1>
      <AffirmationToggle />
      {/* ... theme selection UI ... */}
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<OptionsApp />);