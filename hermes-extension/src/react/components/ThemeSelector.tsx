// hermes-react-refactor/src/components/ThemeSelector.tsx

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setTheme, saveTheme } from '../store/themeSlice';
import { getThemeOptions } from '../themes/theme';

export const ThemeSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const options = getThemeOptions();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    dispatch(setTheme(val));
    dispatch(saveTheme(val));
  };

  return (
    <label style={{ display: 'block', marginBottom: '10px' }}>
      Theme:
      <select value={theme} onChange={handleChange} style={{ marginLeft: '10px' }}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};
