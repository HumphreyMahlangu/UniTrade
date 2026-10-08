// Shared loading / empty / error views so every screen handles these states the same way (NFR3).
import { useEffect, useState } from 'react';

// The free hosting tier puts the API to sleep when idle; the first request then waits
// while it starts (measured ~1.5 min). After this delay we explain the wait instead of just spinning.
export const SLOW_AFTER_MS = 6000;

export function Loading({ label = 'Loading…' }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer); // stop the timer if the data arrives first
  }, []);

  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
      {slow && (
        <p className="state-hint">
          Still working… the server may be waking up after a quiet period. This can take up to 3 minutes.
        </p>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state">
      <p className="state-title">{title}</p>
      {children}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
