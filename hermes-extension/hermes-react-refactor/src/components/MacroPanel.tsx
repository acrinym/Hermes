// hermes-react-refactor/src/components/MacroPanel.tsx

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { deleteMacro, renameMacro, saveMacros } from '../store/macrosSlice';
import { macroEngine } from '@hermes/core';

const MacroPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { macros } = useSelector((state: RootState) => state.macros);

  const handlePlay = (name: string) => {
    macroEngine.play(name, macros);
  };

  const handleDelete = (name: string) => {
    if (window.confirm(`Are you sure you want to delete the macro "${name}"?`)) {
      dispatch(deleteMacro(name));
      dispatch(saveMacros());
    }
  };

  const handleRename = (oldName: string) => {
    const newName = prompt(`Enter a new name for the macro "${oldName}":`, oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
      dispatch(renameMacro({ oldName, newName }));
      dispatch(saveMacros());
    }
  };

  const macroList = Object.keys(macros);

  return (
    <div className="macro-panel">
      <h4>Saved Macros</h4>
      {macroList.length === 0 ? (
        <p className="empty-message">No macros recorded yet.</p>
      ) : (
        <ul>
          {macroList.map((name) => (
            <li key={name}>
              <span className="macro-name">{name}</span>
              <div className="macro-actions">
                <button onClick={() => handlePlay(name)} title="Play">▶️</button>
                <button onClick={() => handleRename(name)} title="Rename">✏️</button>
                <button onClick={() => handleDelete(name)} title="Delete">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MacroPanel;