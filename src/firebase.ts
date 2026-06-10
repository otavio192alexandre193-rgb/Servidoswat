import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, disableNetwork, setLogLevel } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import firebaseConfig from '../firebase-applet-config.json';

// Mute internal Firestore SDK SDK warnings/logs to avoid spamming the console on quota limits
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Early local offline detection to prevent network request attempts if we previously hit the quota limit
if (typeof window !== 'undefined') {
  const isForcedLocal = localStorage.getItem('ciclocred_force_local_offline') === 'true';
  const isQuotaAlreadyLog = localStorage.getItem('firestore_quota_exceeded_status') === 'true';
  if (isForcedLocal || isQuotaAlreadyLog) {
    (window as any).isFirestoreQuotaExceeded = true;
    disableNetwork(db).catch((err) => {
      console.warn("Failed early Firestore network disable:", err);
    });
  }
}

let analytics: Analytics | null = null;
isSupported().then((supported) => {
  if (supported && firebaseConfig.measurementId && firebaseConfig.measurementId.trim() !== "") {
    try {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized successfully");
    } catch (err) {
      console.warn("Could not load Firebase Analytics (likely blocked by sandbox/adblocker):", err);
    }
  } else {
    console.log("Firebase Analytics skipped (no valid measurementId provided or environment restriction)");
  }
}).catch((err) => {
  console.warn("Failed to check or initialize Firebase Analytics:", err);
});

export { analytics };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';
  if (
    errCode === 'resource-exhausted' ||
    errMsg.toLowerCase().includes('quota') || 
    errMsg.toLowerCase().includes('exhausted') || 
    errMsg.toLowerCase().includes('resource-exhausted')
  ) {
    (window as any).isFirestoreQuotaExceeded = true;
    try {
      localStorage.setItem('firestore_quota_exceeded_status', 'true');
      disableFirestoreNetwork();
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
    } catch (_) {}
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function disableFirestoreNetwork() {
  try {
    await disableNetwork(db);
    console.warn("Firestore network integration has been gracefully disabled due to quota limits to avoid console/network spam.");
  } catch (err) {
    console.error("Failed to disable Firestore network gracefully:", err);
  }
}

// Check online connectivity as mandated
async function testConnection() {
  if (typeof window !== 'undefined') {
    const isForcedLocal = localStorage.getItem('ciclocred_force_local_offline') === 'true';
    const isQuotaAlreadyLog = localStorage.getItem('firestore_quota_exceeded_status') === 'true';
    if (isForcedLocal || isQuotaAlreadyLog) {
      return; // Already operating in memory local mode! Skip the remote test.
    }

    try {
      // Proactively check backend server status first to see if database quota is exhausted
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch('/api/server/status', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const status = await res.json();
        if (status.isQuotaExceeded) {
          console.warn("Server reported Firestore quota is exceeded. Transitioning to local offline mode.");
          (window as any).isFirestoreQuotaExceeded = true;
          localStorage.setItem('firestore_quota_exceeded_status', 'true');
          window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
          await disableFirestoreNetwork();
          return;
        } else {
          console.log("Firestore connection verified successful (via server status).");
        }
      }
    } catch (e) {
      console.warn("Failed to check server status in testConnection:", e);
    }
  }
}
testConnection();
