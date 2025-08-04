// @ts-nocheck
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../i18n.js';
import { AffirmationToggle } from './productivity.tsx';
import { applyTheme } from './theme.ts';
import {
  initMacros,
  listMacros,
  startRecording,
  stopRecording,
  playMacro,
  deleteMacro,
  importMacrosFromString,
  exportMacros
} from './macros.ts';
import { refreshHotkeys } from './hotkeys.ts';
import { toggleSchedule, initSchedule } from './schedule.ts';
import { toggleScratchPad, initScratchPad } from './scratchPad.ts';
import { toggleSnippets, initSnippets } from './snippets.ts';
import { toggleTasks, initTasks } from './tasks.ts';
import { toggleTimer } from './timer.ts';
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
  const [macroNames, setMacroNames] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordHotkey, setRecordHotkey] = useState('');
  const [playHotkey, setPlayHotkey] = useState('');

  useEffect(() => {
    chrome.storage.local.get([THEME_KEY, CUSTOM_THEMES_KEY, 'hermes_built_in_themes'], data => {
      const builtin = data.hermes_built_in_themes ? JSON.parse(data.hermes_built_in_themes) : {};
      const customThemes = data[CUSTOM_THEMES_KEY] ? JSON.parse(data[CUSTOM_THEMES_KEY]) : {};
      setBuiltIn(builtin);
      setCustom(customThemes);
      setCurrent(data[THEME_KEY] || 'dark');
    });
  }, []);

  useEffect(() => {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      initMacros().then(() => setMacroNames(listMacros()));
      initSchedule();
      initScratchPad();
      initSnippets();
      initTasks();
      chrome.storage.local.get(['hermes_settings_v1_ext'], data => {
        try {
          const s = data.hermes_settings_v1_ext ? JSON.parse(data.hermes_settings_v1_ext) : {};
          setRecordHotkey(s.recordHotkey || '');
          setPlayHotkey(s.playMacroHotkey || '');
        } catch {}
      });
    }
  }, []);

  useEffect(() => {
    applyTheme(current);
  }, [current]);

  const saveTheme = (val: string) => {
    setCurrent(val);
    chrome.storage.local.set({ [THEME_KEY]: val });
  };

  const exportThemes = () => {
    chrome.storage.local.get([CUSTOM_THEMES_KEY], data => {
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

  const exportMacroData = () => {
    const data = exportMacros('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hermes-macros.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMacroData = (files: FileList | null) => {
    if (!files || !files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      importMacrosFromString(reader.result as string).then(ok => {
        if (ok) setMacroNames(listMacros());
      });
    };
    reader.readAsText(files[0]);
  };

  const handleRecord = () => { startRecording(); setIsRecording(true); };
  const handleStop = () => { stopRecording(); setIsRecording(false); setMacroNames(listMacros()); };
  const handlePlay = (name: string) => { playMacro(name); };
  const handleDelete = (name: string) => { deleteMacro(name); setMacroNames(listMacros()); };

  const saveHotkeys = () => {
    chrome.storage.local.get(['hermes_settings_v1_ext'], data => {
      let s: any = {};
      try { s = data.hermes_settings_v1_ext ? JSON.parse(data.hermes_settings_v1_ext) : {}; } catch {}
      s.recordHotkey = recordHotkey;
      s.playMacroHotkey = playHotkey;
      const json = JSON.stringify(s);
      chrome.storage.local.set({ hermes_settings_v1_ext: json });
      chrome.storage.sync.set({ hermes_settings_v1_ext: json }, () => {});
      refreshHotkeys();
    });
  };

  const allThemes = { ...builtIn, ...custom };

  return (
    <div
      style={{
        background: 'var(--hermes-panel-bg)',
        color: 'var(--hermes-panel-text)',
        padding: '10px',
        border: '1px solid var(--hermes-panel-border)',
        lineHeight: 'var(--hermes-line-height)'
      }}
    >
      <h1>{t('HERMES_OPTIONS')}</h1>
      <label>
        {t('THEME_LABEL')}
        <select
          value={current}
          onChange={e => saveTheme(e.target.value)}
          id="themeSelect"
          style={{
            background: 'var(--hermes-input-bg)',
            color: 'var(--hermes-input-text)',
            border: '1px solid var(--hermes-input-border)'
          }}
        >
          {Object.keys(allThemes).map(key => (
            <option key={key} value={key}>
              {allThemes[key].emoji} {allThemes[key].name}
            </option>
          ))}
        </select>
      </label>
      <div>
        <button onClick={exportThemes} id="exportThemes" className="hermes-button">
          {t('EXPORT_THEMES')}
        </button>
        <input
          id="importFile"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => importThemes(e.target.files)}
        />
        <button
          onClick={() => document.getElementById('importFile')!.click()}
          id="importThemes"
          className="hermes-button"
        >
          {t('IMPORT_THEMES')}
        </button>
      </div>
      <AffirmationToggle />
      <h2>Macros</h2>
      <div>
        <button onClick={isRecording ? handleStop : handleRecord} className="hermes-button" id="recordMacro">
          {isRecording ? t('STOP') : t('REC')}
        </button>
        <button onClick={() => toggleSchedule(true)} className="hermes-button">
          {t('SCHEDULE')}
        </button>
        <button onClick={exportMacroData} id="exportMacros" className="hermes-button">
          {t('EXPORT')}
        </button>
        <input
          id="importMacroFile"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => importMacroData(e.target.files)}
        />
        <button
          onClick={() => document.getElementById('importMacroFile')!.click()}
          id="importMacros"
          className="hermes-button"
        >
          Import
        </button>
      </div>
      <ul>
        {macroNames.map(name => (
          <li key={name} style={{ marginTop: '4px' }}>
            {name}
            <button onClick={() => handlePlay(name)} className="hermes-button" style={{ marginLeft: '4px' }}>
              Play
            </button>
            <button onClick={() => handleDelete(name)} className="hermes-button" style={{ marginLeft: '4px' }}>
              🗑️
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '10px' }}>
        <label style={{ marginRight: '10px' }}>
          Record Hotkey:
          <input value={recordHotkey} onChange={e => setRecordHotkey(e.target.value)} style={{ marginLeft: '4px' }} />
        </label>
        <label>
          Play Hotkey:
          <input value={playHotkey} onChange={e => setPlayHotkey(e.target.value)} style={{ marginLeft: '4px' }} />
        </label>
        <button onClick={saveHotkeys} className="hermes-button" style={{ marginLeft: '10px' }}>
          Save
        </button>
      </div>
      <h2 style={{ marginTop: '20px' }}>Tools</h2>
      <div>
        <button onClick={() => toggleScratchPad(true)} className="hermes-button">
          {t('SCRATCH_PAD')}
        </button>
        <button onClick={() => toggleSnippets(true)} className="hermes-button" style={{ marginLeft: '4px' }}>
          {t('SNIPPETS')}
        </button>
        <button onClick={() => toggleTasks(true)} className="hermes-button" style={{ marginLeft: '4px' }}>
          {t('TASKS')}
        </button>
        <button onClick={() => toggleTimer(true)} className="hermes-button" style={{ marginLeft: '4px' }}>
          {t('TIMER')}
        </button>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<OptionsApp />);
}

export { OptionsApp };
