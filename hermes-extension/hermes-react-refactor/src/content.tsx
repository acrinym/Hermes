// hermes-react-refactor/src/content.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import { MacroEngine } from './services/macroEngineService';

// --- Important Singleton Setup ---
// Instantiate the macro engine and pass it the store's dispatch function
export const macroEngine = new MacroEngine(store.dispatch);
// ---

// Check if the app is already injected
if (!document.getElementById('hermes-react-root')) {
  const rootEl = document.createElement('div');
  rootEl.id = 'hermes-react-root';
  document.body.appendChild(rootEl);

  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}