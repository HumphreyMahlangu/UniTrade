import { Link, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">U</span>
          UniTrade
        </Link>
        <nav className="app-nav" aria-label="Account">
          {user ? (
            <>
              <Link to="/profile" className="nav-link">{user.fullName.split(' ')[0]}</Link>
              <button type="button" className="nav-link nav-button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/register" className="nav-link nav-cta">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
