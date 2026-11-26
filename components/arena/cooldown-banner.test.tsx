import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PRESETS } from '@/lib/presets';

import {
  COOLDOWN_OVER,
  COOLDOWN_TITLE,
  CooldownBanner,
  REPLAY_CHIPS_LABEL,
} from './cooldown-banner';

const NOW = new Date('2026-11-26T12:00:00Z').getTime();
const MINUTE = 60_000;

describe('CooldownBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tells how many minutes are left', () => {
    // Act
    render(<CooldownBanner resetAt={NOW + 4 * MINUTE + 10_000} />);

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent(COOLDOWN_TITLE);
    expect(screen.getByText('Try again in 5 min.')).toBeInTheDocument();
  });

  it('counts down as time passes and says when the cooldown is over', () => {
    // Arrange
    render(<CooldownBanner resetAt={NOW + MINUTE} />);

    // Act
    act(() => {
      vi.advanceTimersByTime(MINUTE);
    });

    // Assert
    expect(screen.getByText(COOLDOWN_OVER)).toBeInTheDocument();
  });

  it('falls back to a vague wait when the reset time is unknown', () => {
    // Act
    render(<CooldownBanner resetAt={null} />);

    // Assert
    expect(screen.getByText('Try again in a few minutes.')).toBeInTheDocument();
  });

  it('offers the pre-rendered presets and replays the picked one', () => {
    // Arrange
    const onReplay = vi.fn();
    render(<CooldownBanner resetAt={NOW + MINUTE} replays={PRESETS} onReplay={onReplay} />);
    const chips = within(screen.getByRole('list', { name: REPLAY_CHIPS_LABEL })).getAllByRole(
      'button',
    );

    // Act
    fireEvent.click(chips[1]);

    // Assert
    expect(chips).toHaveLength(PRESETS.length);
    expect(onReplay).toHaveBeenCalledExactlyOnceWith(PRESETS[1]);
  });

  it('shows no replay chips without recordings', () => {
    // Act
    render(<CooldownBanner resetAt={NOW + MINUTE} />);

    // Assert
    expect(screen.queryByRole('list', { name: REPLAY_CHIPS_LABEL })).toBeNull();
  });
});
