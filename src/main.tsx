import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AtlasProvider } from './state';
import { applyCssVars } from './lib/palette';
import './styles.css';

applyCssVars();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AtlasProvider>
      <App />
    </AtlasProvider>
  </StrictMode>,
);
