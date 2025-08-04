// @ts-nocheck
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../i18n.js';
import { AffirmationToggle } from './productivity.tsx';
import { applyTheme } from './theme.ts';
import { initHighContrast, setHighContrast } from './highContrast.ts';
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
import { backendAPI, initializeBackendAPI } from './backendConfig.ts';
declare const chrome: any;

const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';
const DOMAIN_CONFIGS_KEY = 'hermes_domain_configs_ext';

// Load built-in domain configs bundled with the extension
const builtinConfigs: Record<string, string> = {};
try {
  // @ts-ignore
  const ctx = require.context('../configs', false, /\.json$/);
  ctx.keys().forEach((key: string) => {
    const domain = key.replace('./', '').replace('.json', '');
    builtinConfigs[domain] = JSON.stringify(ctx(key), null, 2);
  });
} catch {
  // require.context not available in tests
}

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
  const [voiceCommands, setVoiceCommands] = useState<{ phrase: string; action: string }[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [newAction, setNewAction] = useState('newTicket');
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [domain, setDomain] = useState('');
  const [configText, setConfigText] = useState('');
  const [highContrast, setHighContrastState] = useState(false);

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
    initHighContrast().then(setHighContrastState);
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
      chrome.storage.local.get(['hermes_voice_commands_ext'], data => {
        try {
          const cmds = data.hermes_voice_commands_ext ? JSON.parse(data.hermes_voice_commands_ext) : [];
          if (Array.isArray(cmds) && cmds.length) setVoiceCommands(cmds);
          else setVoiceCommands([
            { phrase: 'new ticket', action: 'newTicket' },
            { phrase: 'fill form', action: 'fillForm' },
            { phrase: 'high priority', action: 'highPriority' },
            { phrase: 'technical support', action: 'technicalSupport' }
          ]);
        } catch {
          setVoiceCommands([
            { phrase: 'new ticket', action: 'newTicket' },
            { phrase: 'fill form', action: 'fillForm' },
            { phrase: 'high priority', action: 'highPriority' },
            { phrase: 'technical support', action: 'technicalSupport' }
          ]);
        }
      });
    }
    chrome.storage.local.get([DOMAIN_CONFIGS_KEY], data => {
      let stored = {};
      try {
        stored = data[DOMAIN_CONFIGS_KEY] ? JSON.parse(data[DOMAIN_CONFIGS_KEY]) : {};
      } catch {}
      setConfigs({ ...builtinConfigs, ...stored });
    });
    initializeBackendAPI();
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

  const addVoiceCommand = () => {
    if (!newPhrase) return;
    setVoiceCommands([...voiceCommands, { phrase: newPhrase, action: newAction }]);
    setNewPhrase('');
  };

  const updateVoiceCommand = (idx: number, field: 'phrase' | 'action', value: string) => {
    const copy = [...voiceCommands];
    copy[idx] = { ...copy[idx], [field]: value };
    setVoiceCommands(copy);
  };

  const deleteVoiceCommand = (idx: number) => {
    const copy = [...voiceCommands];
    copy.splice(idx, 1);
    setVoiceCommands(copy);
  };

  const saveVoiceCommands = () => {
    chrome.storage.local.set({ hermes_voice_commands_ext: JSON.stringify(voiceCommands) });
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

  const loadConfig = (d: string) => {
    if (!d) return;
    if (configs[d]) {
      setDomain(d);
      setConfigText(configs[d]);
    } else {
      backendAPI.getConfigs(d).then(cfgs => {
        if (cfgs && cfgs.length) {
          const text = JSON.stringify(cfgs[0], null, 2);
          setConfigs(prev => ({ ...prev, [d]: text }));
          setDomain(d);
          setConfigText(text);
        } else {
          setDomain(d);
          setConfigText('{}');
        }
      });
    }
  };

  const saveConfig = () => {
    if (!domain) return;
    const updated = { ...configs, [domain]: configText };
    setConfigs(updated);
    chrome.storage.local.set({ [DOMAIN_CONFIGS_KEY]: JSON.stringify(updated) });
  };

  const deleteConfig = (d: string) => {
    const updated = { ...configs };
    delete updated[d];
    setConfigs(updated);
    chrome.storage.local.set({ [DOMAIN_CONFIGS_KEY]: JSON.stringify(updated) });
  };

  const toggleHighContrast = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setHighContrastState(val);
    setHighContrast(val);
  };

  const exportConfig = () => {
    if (!domain) return;
    const blob = new Blob([configText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (files: FileList | null) => {
    if (!files || !files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        const d = obj.domain || domain || '';
        setDomain(d);
        setConfigText(JSON.stringify(obj, null, 2));
      } catch {
        alert(t('INVALID_JSON'));
      }
    };
    reader.readAsText(files[0]);
  };

  const uploadConfig = () => {
    try {
      const obj = JSON.parse(configText || '{}');
      obj.domain = domain || obj.domain;
      if (!obj.domain) return;
      backendAPI.uploadConfig(obj);
    } catch {
      alert(t('INVALID_JSON'));
    }
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
      <label style={{ marginTop: '10px', display: 'block' }}>
        <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} /> {t('HIGH_CONTRAST_MODE')}
      </label>
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
      <h2 style={{ marginTop: '20px' }}>Voice Commands</h2>
      <div>
        <input
          value={newPhrase}
          onChange={e => setNewPhrase(e.target.value)}
          placeholder="Command phrase"
          style={{
            background: 'var(--hermes-input-bg)',
            color: 'var(--hermes-input-text)',
            border: '1px solid var(--hermes-input-border)',
            marginRight: '4px'
          }}
        />
        <select
          value={newAction}
          onChange={e => setNewAction(e.target.value)}
          style={{
            background: 'var(--hermes-input-bg)',
            color: 'var(--hermes-input-text)',
            border: '1px solid var(--hermes-input-border)',
            marginRight: '4px'
          }}
        >
          <option value="newTicket">New Ticket</option>
          <option value="fillForm">Fill Form</option>
          <option value="highPriority">High Priority</option>
          <option value="technicalSupport">Technical Support</option>
        </select>
        <button onClick={addVoiceCommand} className="hermes-button">
          Add
        </button>
        <button onClick={saveVoiceCommands} className="hermes-button" style={{ marginLeft: '4px' }}>
          Save
        </button>
      </div>
      <ul>
        {voiceCommands.map((vc, i) => (
          <li key={i} style={{ marginTop: '4px' }}>
            <input
              value={vc.phrase}
              onChange={e => updateVoiceCommand(i, 'phrase', e.target.value)}
              style={{
                background: 'var(--hermes-input-bg)',
                color: 'var(--hermes-input-text)',
                border: '1px solid var(--hermes-input-border)',
                marginRight: '4px'
              }}
            />
            <select
              value={vc.action}
              onChange={e => updateVoiceCommand(i, 'action', e.target.value)}
              style={{
                background: 'var(--hermes-input-bg)',
                color: 'var(--hermes-input-text)',
                border: '1px solid var(--hermes-input-border)',
                marginRight: '4px'
              }}
            >
              <option value="newTicket">New Ticket</option>
              <option value="fillForm">Fill Form</option>
              <option value="highPriority">High Priority</option>
              <option value="technicalSupport">Technical Support</option>
            </select>
            <button onClick={() => deleteVoiceCommand(i)} className="hermes-button">
              🗑️
            </button>
          </li>
        ))}
      </ul>
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
      <h2 style={{ marginTop: '20px' }}>{t('DOMAIN_CONFIGS')}</h2>
      <div>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="example.com"
          style={{
            background: 'var(--hermes-input-bg)',
            color: 'var(--hermes-input-text)',
            border: '1px solid var(--hermes-input-border)',
            marginRight: '4px'
          }}
        />
        <button onClick={() => loadConfig(domain)} className="hermes-button">
          {t('LOAD')}
        </button>
        <button onClick={saveConfig} className="hermes-button" style={{ marginLeft: '4px' }}>
          {t('SAVE')}
        </button>
        <button onClick={uploadConfig} className="hermes-button" style={{ marginLeft: '4px' }}>
          {t('UPLOAD')}
        </button>
        <button onClick={exportConfig} className="hermes-button" style={{ marginLeft: '4px' }}>
          {t('EXPORT')}
        </button>
        <input
          id="importConfigFile"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={e => importConfig(e.target.files)}
        />
        <button
          onClick={() => document.getElementById('importConfigFile')!.click()}
          className="hermes-button"
          style={{ marginLeft: '4px' }}
        >
          {t('IMPORT')}
        </button>
      </div>
      <textarea
        value={configText}
        onChange={e => setConfigText(e.target.value)}
        style={{
          width: '100%',
          height: '200px',
          marginTop: '4px',
          background: 'var(--hermes-input-bg)',
          color: 'var(--hermes-input-text)',
          border: '1px solid var(--hermes-input-border)'
        }}
      />
      <ul>
        {Object.keys(configs).map(d => (
          <li key={d} style={{ marginTop: '4px' }}>
            {d}
            <button onClick={() => loadConfig(d)} className="hermes-button" style={{ marginLeft: '4px' }}>
              {t('LOAD')}
            </button>
            <button onClick={() => deleteConfig(d)} className="hermes-button" style={{ marginLeft: '4px' }}>
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<OptionsApp />);
}

export { OptionsApp };