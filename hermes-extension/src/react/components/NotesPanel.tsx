// src/react/components/NotesPanel.tsx
import React, { useState, useEffect } from 'react';

interface NotesPanelProps {
  onClose: () => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ onClose }) => {
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    // Load saved notes
    const saved = localStorage.getItem('hermes_notes');
    if (saved) {
      setNotesText(saved);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('hermes_notes', notesText);
      alert('Notes saved!');
      onClose();
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '600px' }}>
        <h2>Quick Notes</h2>
        <textarea
          id="hermes-notes-area"
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          style={{
            width: '100%',
            height: '40vh',
            minHeight: '200px',
            resize: 'vertical',
            fontFamily: 'monospace',
            padding: '10px',
            boxSizing: 'border-box'
          }}
          placeholder="Enter your notes here..."
        />
        <div className="modal-buttons">
          <button
            onClick={handleSave}
            className="hermes-button"
            style={{ background: 'var(--hermes-success-text)', color: 'var(--hermes-panel-bg)' }}
          >
            Save
          </button>
          <button onClick={onClose} className="hermes-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}; 