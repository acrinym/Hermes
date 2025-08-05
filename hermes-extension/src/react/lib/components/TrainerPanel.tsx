// src/react/lib/components/TrainerPanel.tsx

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { SkippedField, ProfileData } from '@hermes/core';
import { updateProfile, saveProfile } from '../../store/profileSlice';

interface TrainerPanelProps {
  skippedFields: SkippedField[];
  currentProfile: ProfileData;
  onClose: () => void;
}

export const TrainerPanel: React.FC<TrainerPanelProps> = ({ skippedFields, currentProfile, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const currentField = skippedFields[currentIndex];

  React.useEffect(() => {
    if (currentField) {
      setKey(currentField.guess || '');
      setValue(currentProfile[currentField.guess || ''] || '');
    }
  }, [currentField, currentProfile]);

  const handleNext = () => {
    const newProfile = { ...currentProfile, [key]: value };
    dispatch(updateProfile(newProfile));

    if (currentIndex < skippedFields.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      dispatch(saveProfile(newProfile));
      alert('Training complete!');
      onClose();
    }
  };
  
  if (!currentField) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '500px' }}>
        <h3>Heuristic Trainer ({currentIndex + 1}/{skippedFields.length})</h3>
        <p>Field: <strong>{currentField.label}</strong></p>
        <div>
          <label>Profile Key:</label>
          <input type="text" value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <label>Value:</label>
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="modal-buttons">
          <button onClick={handleNext}>Next</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};