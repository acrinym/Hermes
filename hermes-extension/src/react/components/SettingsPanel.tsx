// src/react/components/SettingsPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { saveSettings, updateSettings, loadSettings } from '../store/settingsSlice';
import { loadMacros } from '../store/macrosSlice';
import { ThemeSelector } from './ThemeSelector';
import { AffirmationToggle } from './AffirmationToggle';
import { defaultSettings } from '../config/defaultSettings';
import { exportBackup, importBackup } from '../services/storageService';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSelector((state: RootState) => state.settings);

  const [jsonText, setJsonText] = useState('');
  const [useCoords, setUseCoords] = useState(false);
  const [recordMouse, setRecordMouse] = useState(false);
  const [relativeCoords, setRelativeCoords] = useState(false);
  const [similarity, setSimilarity] = useState(0.5);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(settings, null, 2));
    setUseCoords(settings.macro?.useCoordinateFallback ?? false);
    setRecordMouse(settings.macro?.recordMouseMoves ?? false);
    setRelativeCoords(settings.macro?.relativeCoordinates ?? false);
    setSimilarity(settings.macro?.similarityThreshold ?? 0.5);
  }, [settings]);

  const handleSave = () => {
    try {
      const newSettings = JSON.parse(jsonText);
      newSettings.macro = newSettings.macro || {};
      newSettings.macro.useCoordinateFallback = useCoords;
      newSettings.macro.recordMouseMoves = recordMouse;
      newSettings.macro.relativeCoordinates = relativeCoords;
      newSettings.macro.similarityThreshold = similarity;
      
      dispatch(saveSettings(newSettings));
      alert('Settings saved!');
      onClose();
    } catch (err: any) {
      alert('Invalid JSON: ' + err.message);
    }
  };

  const handleLoadDefaults = () => {
    dispatch(updateSettings(defaultSettings));
    alert('Defaults loaded. Click "Save & Apply" to keep them.');
  };

  const handleExport = async () => {
    const data = await exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hermes_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      dispatch(loadSettings());
      dispatch(loadMacros());
      alert('Backup restored!');
    } catch (err: any) {
      alert('Failed to restore backup: ' + err.message);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '750px' }}>
        <h2>Hermes Settings</h2>
        <textarea
          style={{ width: '100%', height: '40vh', fontFamily: 'monospace', padding: '10px', boxSizing: 'border-box' }}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div style={{ marginTop: '10px' }}>
          <ThemeSelector />
          <AffirmationToggle />
          <label><input type="checkbox" checked={useCoords} onChange={e => setUseCoords(e.target.checked)} /> Use coordinate fallback</label><br/>
          <label><input type="checkbox" checked={recordMouse} onChange={e => setRecordMouse(e.target.checked)} /> Record mouse movements</label><br/>
          <label><input type="checkbox" checked={relativeCoords} onChange={e => setRelativeCoords(e.target.checked)} /> Track element movement</label><br/>
          <label>Similarity Threshold: 
            <input type="range" min="0" max="1" step="0.05" value={similarity} onChange={e => setSimilarity(parseFloat(e.target.value))} style={{width: '150px'}} />
            <span>{similarity.toFixed(2)}</span>
          </label>
        </div>
        <div className="modal-buttons">
          <button onClick={handleSave}>Save & Apply</button>
          <button onClick={handleLoadDefaults}>Load Defaults</button>
          <button onClick={handleExport}>Download Backup</button>
          <button onClick={handleImportClick}>Restore Backup</button>
          <button onClick={onClose}>Close</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
      </div>
    </div>
  );
};