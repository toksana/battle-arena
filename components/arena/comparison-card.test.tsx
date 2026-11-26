import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAX_WEIGHT } from '@/lib/ai/schemas';
import { makeComparison, makeCriterion } from '@/test/factories';

import { ADJUST_WEIGHTS_LABEL, CONFIDENCE_LABEL, ComparisonCard } from './comparison-card';
import { LEADING_LABEL } from './option-card';
import { RESET_WEIGHTS_LABEL } from './weight-sliders';

describe('ComparisonCard', () => {
  it('renders both options with their pros, cons and metrics', () => {
    // Arrange
    const comparison = makeComparison();
    const [a, b] = comparison.options;

    // Act
    render(<ComparisonCard input={comparison} isStreaming={false} />);

    // Assert
    const optionA = within(screen.getByRole('region', { name: a.name }));
    expect(screen.getByRole('region', { name: b.name })).toBeInTheDocument();
    expect(
      within(optionA.getByRole('list', { name: 'Pros' })).getAllByRole('listitem'),
    ).toHaveLength(a.pros.length);
    expect(
      within(optionA.getByRole('list', { name: 'Cons' })).getAllByRole('listitem'),
    ).toHaveLength(a.cons.length);
    a.metrics.forEach((metric) => expect(optionA.getByText(metric.value)).toBeInTheDocument());
  });

  it('renders one bar pair per criterion and the verdict with confidence', () => {
    // Arrange
    const comparison = makeComparison();

    // Act
    render(<ComparisonCard input={comparison} isStreaming={false} />);

    // Assert
    const criteria = within(screen.getByRole('region', { name: 'Criteria' }));
    comparison.criteria.forEach((criterion) =>
      expect(criteria.getByText(criterion.label)).toBeInTheDocument(),
    );
    expect(screen.getByText(comparison.verdict.summary)).toBeInTheDocument();
    expect(screen.getByText(CONFIDENCE_LABEL[comparison.verdict.confidence])).toBeInTheDocument();
  });

  it('skips criteria whose scores have not streamed in yet', () => {
    // Arrange
    const ready = makeCriterion();
    const pending = { label: faker.lorem.word() };

    // Act
    render(
      <ComparisonCard
        input={{ title: faker.lorem.words(2), criteria: [ready, pending] }}
        isStreaming
      />,
    );

    // Assert
    expect(screen.getByText(ready.label)).toBeInTheDocument();
    expect(screen.queryByText(pending.label)).toBeNull();
  });

  it('shows skeletons for missing fields only while streaming', () => {
    // Arrange
    const partial = { goal: faker.lorem.word() };

    // Act
    const { container, rerender } = render(<ComparisonCard input={partial} isStreaming />);
    const whileStreaming = container.querySelectorAll('[data-slot="skeleton"]').length;
    rerender(<ComparisonCard input={partial} isStreaming={false} />);
    const afterStreaming = container.querySelectorAll('[data-slot="skeleton"]').length;

    // Assert
    expect(whileStreaming).toBeGreaterThan(0);
    expect(afterStreaming).toBe(0);
  });

  it('shows only the witty reason for an irrelevant battle', () => {
    // Arrange
    const comparison = {
      ...makeComparison(),
      isRelevant: false,
      fallbackReason: faker.lorem.sentence(),
    };

    // Act
    render(<ComparisonCard input={comparison} isStreaming={false} />);

    // Assert
    expect(screen.getByText(comparison.fallbackReason)).toBeInTheDocument();
    expect(screen.queryByText(comparison.options[0].name)).toBeNull();
    expect(screen.queryByText(comparison.verdict.summary)).toBeNull();
  });

  describe('scores and leader', () => {
    /** A wins on defaults (30 vs 20); raising the second weight to 5 hands the lead to B. */
    const closeBattle = () =>
      makeComparison({
        criteria: [
          makeCriterion({ scoreA: 10, scoreB: 0, defaultWeight: 3 }),
          makeCriterion({ scoreA: 0, scoreB: 10, defaultWeight: 2 }),
          makeCriterion({ scoreA: 5, scoreB: 5, defaultWeight: 1 }),
        ],
      });

    const optionRegion = (comparison: ReturnType<typeof makeComparison>, index: number) =>
      screen.getByRole('region', { name: comparison.options[index].name });

    it('highlights the leader with its score once streaming ends', () => {
      // Arrange
      const comparison = closeBattle();

      // Act
      render(<ComparisonCard input={comparison} isStreaming={false} />);

      // Assert
      const [a, b] = [optionRegion(comparison, 0), optionRegion(comparison, 1)];
      expect(a).toHaveAttribute('data-leader', 'true');
      expect(within(a).getByText(LEADING_LABEL)).toBeInTheDocument();
      expect(within(a).getByText('Score 58 of 100')).toBeInTheDocument();
      expect(b).not.toHaveAttribute('data-leader');
      expect(within(b).getByText('Score 42 of 100')).toBeInTheDocument();
    });

    it('leaves both options neutral on a tie', () => {
      // Arrange
      const comparison = makeComparison({
        criteria: [
          makeCriterion({ scoreA: 6, scoreB: 6 }),
          makeCriterion({ scoreA: 3, scoreB: 3 }),
        ],
      });

      // Act
      render(<ComparisonCard input={comparison} isStreaming={false} />);

      // Assert
      expect(screen.queryByText(LEADING_LABEL)).toBeNull();
      expect(optionRegion(comparison, 0)).not.toHaveAttribute('data-leader');
      expect(optionRegion(comparison, 1)).not.toHaveAttribute('data-leader');
    });

    it('shows no scores or weight controls while streaming', () => {
      // Arrange
      const comparison = closeBattle();

      // Act
      render(<ComparisonCard input={comparison} isStreaming />);

      // Assert
      expect(screen.queryByText(/^Score \d+ of 100$/)).toBeNull();
      expect(screen.queryByText(LEADING_LABEL)).toBeNull();
      expect(screen.queryByRole('button', { name: ADJUST_WEIGHTS_LABEL })).toBeNull();
    });

    it('moves the lead when a weight changes and restores it on reset', () => {
      // Arrange
      const comparison = closeBattle();
      render(<ComparisonCard input={comparison} isStreaming={false} />);
      fireEvent.click(screen.getByRole('button', { name: ADJUST_WEIGHTS_LABEL }));
      const reset = screen.getByRole('button', { name: RESET_WEIGHTS_LABEL });
      const resetInitiallyDisabled = reset.hasAttribute('disabled');

      // Act
      fireEvent.keyDown(
        screen.getByRole('slider', { name: `${comparison.criteria[1].label} weight` }),
        { key: 'End' },
      );
      const leaderAfterChange = screen.getByText(LEADING_LABEL).closest('section');
      const summaryLeaderAfterChange = within(screen.getByLabelText('Current score'))
        .getByText(comparison.options[1].name)
        .closest('[data-leader]')?.textContent;
      const scoreBAfterChange = within(optionRegion(comparison, 1)).getByText(/^Score/).textContent;
      fireEvent.click(reset);
      const leaderAfterReset = screen.getByText(LEADING_LABEL).closest('section');

      // Assert
      expect(resetInitiallyDisabled).toBe(true);
      expect(leaderAfterChange).toBe(optionRegion(comparison, 1));
      expect(scoreBAfterChange).toBe('Score 61 of 100');
      expect(summaryLeaderAfterChange).toContain('61');
      expect(leaderAfterReset).toBe(optionRegion(comparison, 0));
      expect(screen.getAllByRole('slider')[1]).toHaveAttribute('aria-valuenow', '2');
    });

    it('caps every slider at the maximum weight', () => {
      // Arrange
      render(<ComparisonCard input={closeBattle()} isStreaming={false} />);
      fireEvent.click(screen.getByRole('button', { name: ADJUST_WEIGHTS_LABEL }));

      // Act
      const sliders = screen.getAllByRole('slider');

      // Assert
      sliders.forEach((slider) =>
        expect(slider).toHaveAttribute('aria-valuemax', String(MAX_WEIGHT)),
      );
    });
  });
});
