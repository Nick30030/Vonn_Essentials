// Minimal firebase-like stub used when Firebase isn't configured locally.
// This prevents build-time errors from imports like `../lib/firebase`
// while the app can still run without realtime Firestore subscriptions.

export const db: any = null;

export const auth: any = null;

export const doc = (..._args: any[]) => {
  // Return a simple reference object placeholder
  return { __stub: true };
};

export const onSnapshot = (
  _ref: any,
  _next?: (snap: any) => void,
  _error?: (err: any) => void
) => {
  // No-op: return an unsubscribe function
  return () => {};
};

export const setDoc = async (_ref: any, _data: any, _options?: any) => {
  // No-op promise to mimic Firebase setDoc
  return Promise.resolve();
};

export default {
  db,
  doc,
  onSnapshot,
  setDoc,
};
