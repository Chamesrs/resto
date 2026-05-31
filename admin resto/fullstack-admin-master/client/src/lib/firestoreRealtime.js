import { onSnapshot } from "firebase/firestore";

export function subscribeToSnapshot(
  target,
  { onNext, onError, onMetadata, label = "firestore-listener" }
) {
  let active = true;
  let unsubscribe = null;

  // React.StrictMode mounts, unmounts, then mounts again in development.
  // Defer listener creation by one macrotask so the first transient mount
  // does not open a short-lived watch stream.
  const timeoutId = setTimeout(() => {
    if (!active) {
      return;
    }

    unsubscribe = onSnapshot(
      target,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) {
          return;
        }

        onMetadata?.(snapshot.metadata, snapshot);
        onNext?.(snapshot, snapshot.metadata);
      },
      (error) => {
        if (!active) {
          return;
        }

        console.error(`[${label}] Firestore listener error`, error);
        onError?.(error);
      }
    );
  }, 0);

  return () => {
    active = false;
    clearTimeout(timeoutId);

    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  };
}
