// hermes-react-refactor/src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Standard create-react-app css
import Content from './content'; // We will create a Content component

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Content />
  </React.StrictMode>
);