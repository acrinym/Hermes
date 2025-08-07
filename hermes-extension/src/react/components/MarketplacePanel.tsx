// src/react/components/MarketplacePanel.tsx

import React, { useEffect, useState } from 'react';
import { fetchMarketplaceManifest, downloadPlugin, MarketplacePlugin } from '../services/marketplaceService';

export const MarketplacePanel: React.FC = () => {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceManifest()
      .then(setPlugins)
      .catch(err => console.error('Failed to load manifest', err))
      .finally(() => setLoading(false));
  }, []);

  const handleInstall = (plugin: MarketplacePlugin) => {
    downloadPlugin(plugin)
      .then(() => alert(`${plugin.name} installed`))
      .catch(err => alert(`Install failed: ${err.message}`));
  };

  if (loading) {
    return <div>Loading plugins...</div>;
  }

  return (
    <div>
      <h3>Plugin Marketplace</h3>
      <ul>
        {plugins.map(plugin => (
          <li key={plugin.name}>
            <strong>{plugin.name}</strong> v{plugin.version} - {plugin.description}
            <button onClick={() => handleInstall(plugin)}>Install</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
