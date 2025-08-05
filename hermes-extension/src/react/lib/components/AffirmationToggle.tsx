import React, { useEffect, useState } from 'react';
import { getAffirmationState, setAffirmations } from '../../services/affirmationService';

export const AffirmationToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getAffirmationState().then(setEnabled);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setEnabled(val);
    setAffirmations(val);
  };

  return (
    <label>
      <input type="checkbox" checked={enabled} onChange={onChange} /> Enable Positive Affirmations
    </label>
  );
};
