// src/react/components/TimerPanel.tsx
import React, { useState, useEffect } from 'react';

interface TimerPanelProps {
  onClose: () => void;
}

interface PomodoroSettings {
  work: number;
  break: number;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({ onClose }) => {
  const [pomodoroRemaining, setPomodoroRemaining] = useState(0);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroInterval, setPomodoroInterval] = useState<NodeJS.Timeout | null>(null);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({ work: 25, break: 5 });

  useEffect(() => {
    // Load saved pomodoro settings
    const saved = localStorage.getItem('hermes_pomodoro_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPomodoroSettings(parsed);
      } catch (e) {
        console.error('Failed to load pomodoro settings:', e);
      }
    }
  }, []);

  const updatePomodoroDisplay = (remaining: number) => {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const startPomodoro = () => {
    if (pomodoroInterval) return;
    
    let remaining = pomodoroRemaining;
    if (remaining <= 0) {
      setPomodoroMode('work');
      remaining = (pomodoroSettings.work || 25) * 60;
      setPomodoroRemaining(remaining);
    }

    const interval = setInterval(() => {
      setPomodoroRemaining(prev => {
        const newRemaining = prev - 1;
        
        if (newRemaining <= 0) {
          if (pomodoroMode === 'work') {
            setPomodoroMode('break');
            const breakTime = (pomodoroSettings.break || 5) * 60;
            setPomodoroRemaining(breakTime);
            alert('Break time!');
          } else {
            setPomodoroMode('work');
            const workTime = (pomodoroSettings.work || 25) * 60;
            setPomodoroRemaining(workTime);
            alert('Back to work!');
          }
          clearInterval(interval);
          setPomodoroInterval(null);
          return pomodoroMode === 'work' ? (pomodoroSettings.break || 5) * 60 : (pomodoroSettings.work || 25) * 60;
        }
        
        return newRemaining;
      });
    }, 1000);

    setPomodoroInterval(interval);
  };

  const stopPomodoro = () => {
    if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      setPomodoroInterval(null);
    }
  };

  const resetPomodoro = () => {
    stopPomodoro();
    setPomodoroRemaining(0);
    setPomodoroMode('work');
  };

  const handleSettingsChange = (type: 'work' | 'break', value: number) => {
    const newSettings = { ...pomodoroSettings, [type]: value };
    setPomodoroSettings(newSettings);
    localStorage.setItem('hermes_pomodoro_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '300px' }}>
        <h2>Pomodoro Timer</h2>
        
        <div style={{ textAlign: 'center', fontSize: '2em', marginBottom: '10px' }}>
          {updatePomodoroDisplay(pomodoroRemaining)}
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '0.9em', color: 'var(--hermes-text-secondary)' }}>
          {pomodoroMode === 'work' ? 'Work Time' : 'Break Time'}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
          <button
            onClick={startPomodoro}
            disabled={!!pomodoroInterval}
            className="hermes-button"
            style={{ background: 'var(--hermes-success-text)', color: 'var(--hermes-panel-bg)' }}
          >
            Start
          </button>
          <button
            onClick={stopPomodoro}
            disabled={!pomodoroInterval}
            className="hermes-button"
            style={{ background: 'var(--hermes-error-text)', color: 'var(--hermes-panel-bg)' }}
          >
            Stop
          </button>
          <button
            onClick={resetPomodoro}
            className="hermes-button"
          >
            Reset
          </button>
        </div>
        
        <div style={{ fontSize: '0.9em' }}>
          <div style={{ marginBottom: '5px' }}>
            <label>
              Work Time (minutes): 
              <input
                type="number"
                min="1"
                max="120"
                value={pomodoroSettings.work}
                onChange={(e) => handleSettingsChange('work', parseInt(e.target.value) || 25)}
                style={{ marginLeft: '5px', width: '60px' }}
              />
            </label>
          </div>
          <div>
            <label>
              Break Time (minutes): 
              <input
                type="number"
                min="1"
                max="60"
                value={pomodoroSettings.break}
                onChange={(e) => handleSettingsChange('break', parseInt(e.target.value) || 5)}
                style={{ marginLeft: '5px', width: '60px' }}
              />
            </label>
          </div>
        </div>
        
        <div className="modal-buttons">
          <button onClick={onClose} className="hermes-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 