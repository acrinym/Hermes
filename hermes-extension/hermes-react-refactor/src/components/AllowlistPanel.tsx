// hermes-react-refactor/src/components/AllowlistPanel.tsx
import React, { useEffect, useState } from 'react';
import { loadWhitelist, saveWhitelist } from '../services/allowlistService';

interface AllowlistPanelProps {
  onClose: () => void;
}

const AllowlistPanel: React.FC<AllowlistPanelProps> = ({ onClose }) => {
  const [list, setList] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadWhitelist().then(setList);
  }, []);

  const addDomain = async () => {
    const domain = input.trim();
    if (!domain) return;
    const newList = [...list, domain];
    setList(newList);
    setInput('');
    await saveWhitelist(newList);
  };

  const removeDomain = async (domain: string) => {
    const newList = list.filter(d => d !== domain);
    setList(newList);
    await saveWhitelist(newList);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '400px' }}>
        <h3>Allowed Domains</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ width: '70%' }}
            placeholder="example.com"
          />{' '}
          <button onClick={addDomain}>Add</button>
        </div>
        <ul className="allowlist-list">
          {list.map(domain => (
            <li key={domain}>
              <span>{domain}</span>
              <button onClick={() => removeDomain(domain)}>X</button>
            </li>
          ))}
        </ul>
        <div className="modal-buttons">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AllowlistPanel;
