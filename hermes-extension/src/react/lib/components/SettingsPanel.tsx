// src/react/lib/components/SettingsPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { saveSettings, updateSettings, loadSettings } from '../../store/settingsSlice';
import { loadMacros } from '../../store/macrosSlice';
import { ThemeSelector } from './ThemeSelector';
import { AffirmationToggle } from './AffirmationToggle';
import { defaultSettings } from '../../config/defaultSettings';
import { exportBackup, importBackup } from '../../services/storageService';

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useSelector((state: RootState) => state.settings);
  const [jsonText, setJsonText] = useState('');
  const [recordMouse, setRecordMouse] = useState(false);
  const [relativeCoords, setRelativeCoords] = useState(false);
  const [similarity, setSimilarity] = useState(0.5);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(settings, null, 2));
    setRecordMouse(settings.macro?.recordMouseMoves || false);
    setRelativeCoords(settings.macro?.relativeCoordinates || false);
    setSimilarity(settings.macro?.similarityThreshold || 0.5);
  }, [settings]);

  const handleSave = () => {
    try {
      const parsedSettings = JSON.parse(jsonText);
      dispatch(updateSettings(parsedSettings));
      dispatch(saveSettings(parsedSettings));
      onClose();
    } catch (e) {
      alert('Error: Invalid JSON in settings.');
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
        <h2>Settings</h2>
        <div className="settings-container">
          <textarea
            className="settings-json-editor"
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
          />
          <div className="settings-controls">
            <ThemeSelector />
            <AffirmationToggle />
          </div>
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