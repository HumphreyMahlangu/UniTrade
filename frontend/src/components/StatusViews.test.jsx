import { act, render, screen } from '@testing-library/react';
import { Loading, SLOW_AFTER_MS } from './StatusViews.jsx';

describe('NFR3 - loading state', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('nfr3_01 loading view explains a slow (waking) server instead of only spinning', () => {
    render(<Loading label="Checking the server…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Checking the server…');
    expect(screen.queryByText(/waking up/i)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(SLOW_AFTER_MS));

    expect(screen.getByText(/waking up/i)).toBeInTheDocument();
  });
});
