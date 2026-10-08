import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App.jsx';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Slice 0 - app shell', () => {
  afterEach(() => vi.restoreAllMocks());

  it('slice0_01 shows the API and database status from /api/health', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'UP', database: 'UP' }), { status: 200 }),
    );
    renderAt('/');
    expect(screen.getByRole('heading', { name: /welcome to unitrade/i })).toBeInTheDocument();
    expect(await screen.findByText(/database:/i)).toBeInTheDocument();
  });

  it('slice0_02 shows a friendly error (not a blank screen) when the server is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the unitrade server/i);
  });

  it('slice0_03 shows a not-found page for unknown routes', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
