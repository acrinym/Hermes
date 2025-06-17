// hermes-react-refactor/src/components/SettingsPanel.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { saveSettings, updateSettings } from '../store/settingsSlice';
import { ThemeSelector } from './ThemeSelector';
import { AffirmationToggle } from './AffirmationToggle';
import { defaultSettings } from '../config/defaultSettings';

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
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};