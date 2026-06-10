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
    'ciclocred_user_name': 'Operador CicloCred',
    'ciclocred_user_email': 'operador@ciclocred.com',
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

console.log('[main.tsx] Starting cicloCRED CRM mounting lifecycle...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[main.tsx] CRITICAL: Root element with ID "root" was NOT found in the document tree. Rendering aborted.');
} else {
  console.log('[main.tsx] Target root container successfully found. Initializing React 18 createRoot...');
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[main.tsx] React render has been dispatched to container.');
  } catch (mountError) {
    console.error('[main.tsx] CRITICAL mounting error intercepted in main.tsx:', mountError);
  }
}

// Register the PWA Service Worker to enable proper desktop install, standalone mode, and bypass white screens
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
        
        // Check for updates proactively
        registration.update().catch((uErr) => console.log('[PWA] Sw update fail safe:', uErr));

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker installed & waiting. Invoking skipWaiting.');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });

  // Hot refresh on controller change to ensure live cache-free assets are rendered immediately
  let isRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true;
      console.log('[PWA] Service worker controller has updated. Force reloading layout.');
      window.location.reload();
    }
  });
}

if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      caches.delete(key).then(() => {
        console.log('[PWA] Wiped Cache Storage on Startup:', key);
      });
    });
  }).catch((err) => console.warn('[PWA] Error clearing caches on startup:', err));
}


