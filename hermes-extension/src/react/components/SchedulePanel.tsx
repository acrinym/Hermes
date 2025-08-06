// src/react/components/SchedulePanel.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { saveScheduleSettings } from '../store/settingsSlice';
import { schedulerService } from '../services/schedulerService';

interface SchedulePanelProps {
  onClose: () => void;
}

interface ScheduleSettings {
  selected: string[];
  date: string;
  time: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const macros = useSelector((state: RootState) => state.macros.macros);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    selected: [],
    date: '',
    time: '',
    recurrence: 'once'
  });
  const [scheduledMacros, setScheduledMacros] = useState<any[]>([]);

  useEffect(() => {
    // Load saved schedule settings
    const saved = localStorage.getItem('hermes_schedule_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScheduleSettings(parsed);
      } catch (e) {
        console.error('Failed to load schedule settings:', e);
      }
    }

    // Load current scheduled macros
    setScheduledMacros(schedulerService.getScheduledMacros());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduleSettings.date || !scheduleSettings.time || scheduleSettings.selected.length === 0) {
      alert('Please select macros, date, and time');
      return;
    }

    try {
      // Save schedule settings
      localStorage.setItem('hermes_schedule_settings', JSON.stringify(scheduleSettings));
      
      // Schedule the macros
      const scheduledTime = new Date(`${scheduleSettings.date}T${scheduleSettings.time}`);
      const now = new Date();
      
      if (scheduledTime <= now) {
        alert('Please select a future date and time');
        return;
      }

      // Add scheduled macros to the scheduler
      scheduleSettings.selected.forEach(macroName => {
        schedulerService.addScheduledMacro({
          name: macroName,
          scheduledTime: scheduledTime.toISOString(),
          recurrence: scheduleSettings.recurrence,
          enabled: true
        });
      });

      // Update the display
      setScheduledMacros(schedulerService.getScheduledMacros());
      
      alert(`Scheduled ${scheduleSettings.selected.length} macro(s) for ${scheduledTime.toLocaleString()}`);
      onClose();
    } catch (error) {
      console.error('Failed to schedule macros:', error);
      alert('Failed to schedule macros');
    }
  };

  const handleMacroToggle = (macroName: string) => {
    setScheduleSettings(prev => ({
      ...prev,
      selected: prev.selected.includes(macroName)
        ? prev.selected.filter(name => name !== macroName)
        : [...prev.selected, macroName]
    }));
  };

  const removeScheduledMacro = (macroName: string) => {
    schedulerService.removeScheduledMacro(macroName);
    setScheduledMacros(schedulerService.getScheduledMacros());
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '600px' }}>
        <h2>Schedule Macros</h2>
        
        {/* Current Scheduled Macros */}
        {scheduledMacros.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Currently Scheduled</h3>
            <div style={{ maxHeight: '20vh', overflowY: 'auto', marginBottom: '10px' }}>
              {scheduledMacros.map((macro, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ flex: 1 }}>
                    {macro.name} - {new Date(macro.scheduledTime).toLocaleString()} ({macro.recurrence})
                  </span>
                  <button
                    onClick={() => removeScheduledMacro(macro.name)}
                    className="hermes-button"
                    style={{ marginLeft: '10px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <fieldset style={{ marginBottom: '10px' }}>
            <legend>Select Macros</legend>
            <div style={{ maxHeight: '30vh', overflowY: 'auto', marginBottom: '10px' }}>
              {Object.keys(macros).map(macroName => (
                <label key={macroName} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={scheduleSettings.selected.includes(macroName)}
                    onChange={() => handleMacroToggle(macroName)}
                  />
                  {' '}{macroName}
                </label>
              ))}
            </div>
          </fieldset>
          
          <div style={{ marginBottom: '8px' }}>
            <label>
              Date: <input
                type="date"
                value={scheduleSettings.date}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label>
              Time: <input
                type="time"
                value={scheduleSettings.time}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </label>
          </div>
          
          <fieldset style={{ marginBottom: '8px' }}>
            <legend>Repeat</legend>
            <label>
              <input
                type="radio"
                name="recurrence"
                value="once"
                checked={scheduleSettings.recurrence === 'once'}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, recurrence: e.target.value as any }))}
              />
              Once
            </label>
            <label>
              <input
                type="radio"
                name="recurrence"
                value="daily"
                checked={scheduleSettings.recurrence === 'daily'}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, recurrence: e.target.value as any }))}
              />
              Daily
            </label>
            <label>
              <input
                type="radio"
                name="recurrence"
                value="weekly"
                checked={scheduleSettings.recurrence === 'weekly'}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, recurrence: e.target.value as any }))}
              />
              Weekly
            </label>
            <label>
              <input
                type="radio"
                name="recurrence"
                value="monthly"
                checked={scheduleSettings.recurrence === 'monthly'}
                onChange={(e) => setScheduleSettings(prev => ({ ...prev, recurrence: e.target.value as any }))}
              />
              Monthly
            </label>
          </fieldset>
          
          <div className="modal-buttons">
            <button type="submit" className="hermes-button" style={{ background: 'var(--hermes-success-text)', color: 'var(--hermes-panel-bg)' }}>
              Schedule
            </button>
            <button type="button" onClick={onClose} className="hermes-button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 