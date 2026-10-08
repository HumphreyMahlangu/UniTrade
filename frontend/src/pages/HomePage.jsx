import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { ErrorMessage, Loading } from '../components/StatusViews.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setError(null);
    setHealth(null);
    try {
      setHealth(await apiRequest('/api/health'));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <section>
      <h1>Welcome to UniTrade</h1>
      <p className="muted">Buy, sell and share with fellow CPUT students.</p>

      {user ? (
        <p>
          Hi {user.fullName.split(' ')[0]}, you are logged in.
        </p>
      ) : (
        <div className="actions">
          <Link to="/register" className="btn btn-primary">Create account</Link>
          <Link to="/login" className="btn btn-secondary">Log in</Link>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">System status</h2>
        {error && <ErrorMessage message={error} onRetry={checkHealth} />}
        {!error && !health && <Loading label="Checking the server…" />}
        {health && (
          <p>
            API: <strong>{health.status}</strong> · Database: <strong>{health.database}</strong>
          </p>
        )}
      </div>
    </section>
  );
}
