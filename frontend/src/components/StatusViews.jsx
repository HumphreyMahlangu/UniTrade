// Shared loading / empty / error views so every screen handles these states the same way (NFR3).

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
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
