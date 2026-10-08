import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="state">
      <h1>Page not found</h1>
      <p className="muted">The page you opened does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </section>
  );
}
