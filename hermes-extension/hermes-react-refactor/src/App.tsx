// hermes-react-refactor/src/App.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { SettingsPanel } from './components/SettingsPanel';
import MacroPanel from './components/MacroPanel';
import { TrainerPanel } from './components/TrainerPanel';
import AllowlistPanel from './components/AllowlistPanel';
import { useDraggable } from './hooks/useDraggable';
import { macroEngine } from './services/macroEngineService';
import { fillForm } from './services/formFillerService';
import { startHeuristicTraining } from './services/trainerService';
import { SkippedField } from './services/heuristicsService';
import { loadProfile } from './store/profileSlice';
import { loadSettings } from './store/settingsSlice';
import { loadMacros, saveMacros } from './store/macrosSlice';
import { loadTheme } from './store/themeSlice';
import { applyTheme } from './themes/theme';

import './App.css';

const App: React.FC = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { position, isStacked } = useDraggable(appRef, headerRef);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [trainingSession, setTrainingSession] = useState<SkippedField[] | null>(null);
  const [showAllowlist, setShowAllowlist] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { recordingState } = useSelector((state: RootState) => state.macros);
  const { profile } = useSelector((state: RootState) => state.profile);
  const { settings } = useSelector((state: RootState) => state.settings);
  const { theme } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    dispatch(loadProfile());
    dispatch(loadSettings());
    dispatch(loadMacros());
    dispatch(loadTheme());
  }, [dispatch]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleRecord = () => {
    if (recordingState === 'recording') {
      macroEngine.stopRecording();
      // After stopping, we should save all macros
      setTimeout(() => dispatch(saveMacros()), 100);
    } else {
      const name = prompt('Enter a name for the new macro:');
      if (name && name.trim() !== '') {
        macroEngine.startRecording(name, settings.macro);
      }
    }
  };

  const handleFill = async () => {
    const skipped = await fillForm(profile);
    if (skipped.length > 0) {
      alert(`${skipped.length} field(s) were not filled. Use the 'Train' button to improve accuracy.`);
    } else {
      alert('Form filled successfully!');
    }
  };

  const handleTrain = async () => {
    const skippedFields = await startHeuristicTraining(profile);
    if (skippedFields.length > 0) {
      setTrainingSession(skippedFields);
    } else {
      alert('No fields to train. The form was filled completely!');
    }
  };

  return (
    <div
      ref={appRef}
      className={`hermes-container ${isStacked ? 'stacked' : ''}`}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
    >
      <div className="hermes-header" ref={headerRef}>
        <h1>Hermes</h1>
        <span>{recordingState === 'recording' ? '🔴 Recording...' : ''}</span>
      </div>
      <div className="hermes-body">
        <MacroPanel />
      </div>
      <div className="hermes-footer">
        <button onClick={handleFill}>Fill</button>
        <button onClick={handleRecord} className={recordingState === 'recording' ? 'recording' : ''}>
          {recordingState === 'recording' ? 'Stop' : 'Record'}
        </button>
        <button onClick={handleTrain}>Train</button>
        <button onClick={() => setSettingsVisible(true)}>Settings</button>
        <button onClick={() => setShowAllowlist(true)}>Allowlist</button>
      </div>

      {isSettingsVisible && <SettingsPanel onClose={() => setSettingsVisible(false)} />}
      {trainingSession && (
        <TrainerPanel
          skippedFields={trainingSession}
          currentProfile={profile}
          onClose={() => setTrainingSession(null)}
        />
      )}
      {showAllowlist && <AllowlistPanel onClose={() => setShowAllowlist(false)} />}
    </div>
  );
};

export default App;