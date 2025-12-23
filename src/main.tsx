import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // ESTA LINHA É O QUE FAZ O VISUAL APARECER

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
