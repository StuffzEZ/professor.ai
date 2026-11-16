import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Failed to find root element');

createRoot(rootEl).render(
  <StrictMode>
    <AppProvider initialUser={null}>
      <App />
    </AppProvider>
  </StrictMode>
);