import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// SECURE STORAGE SYSTEM IMMUNIZATION (Prevents Sandbox, Standalone IFrame, or restricted PWA localStorage crashes)
try {
  const testKey = '__storage_test_key__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  console.log('[PWA Status] Global localStorage is fully accessible and verified active.');
} catch (storageError) {
  console.warn('[PWA Status] Warning: Global localStorage is restricted or blocked in this environment. Activating high-security virtual storage:', storageError);
  
  const memoryStore: Record<string, string> = {
    'ciclocred_auth_active': 'false',
    'ciclocred_user_name': 'Operador Cury Constelação',
    'ciclocred_user_email': 'operador@sistema.com.br',
    'ciclocred_theme': 'escuro',
    'ciclocred_galaxy_preset': 'lineack'
  };
  
  const virtualStorage = {
    getItem: (key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    setItem: (key: string, value: string): void => {
      memoryStore[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete memoryStore[key];
    },
    clear: (): void => {
      for (const k in memoryStore) {
        delete memoryStore[k];
      }
    },
    key: (index: number): string | null => {
      const keys = Object.keys(memoryStore);
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    get length(): number {
      return Object.keys(memoryStore).length;
    }
  };

  try {
    Object.defineProperty(window, 'localStorage', {
      value: virtualStorage,
      writable: true,
      configurable: true
    });
  } catch (overrideError) {
    console.warn('[PWA Status] Could not redefine window.localStorage. Emulating in global context.', overrideError);
    try {
      (window as any).localStorage = virtualStorage;
    } catch (_) {}
  }
}

import App from './App.tsx';
import './index.css';
import { ConfigProvider } from "./context/ConfigContext";

console.log('[main.tsx] Starting Cury Constelação CRM mounting lifecycle...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[main.tsx] CRITICAL: Root element with ID "root" was NOT found in the document tree. Rendering aborted.');
} else {
  console.log('[main.tsx] Target root container successfully found. Initializing React 18 createRoot...');
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </StrictMode>,
    );
    console.log('[main.tsx] React render has been dispatched to container.');
  } catch (mountError) {
    console.error('[main.tsx] CRITICAL mounting error intercepted in main.tsx:', mountError);
  }
}

// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, ignore or prompt to refresh.');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Ready to work offline');
  },
});

if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      caches.delete(key).then(() => {
        console.log('[PWA] Wiped Cache Storage on Startup:', key);
      });
    });
  }).catch((err) => console.warn('[PWA] Error clearing caches on startup:', err));
}


