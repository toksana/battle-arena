import { faker } from '@faker-js/faker';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeComparison, makeCriterion } from '@/test/factories';

import { CONFIDENCE_LABEL, ComparisonCard } from './comparison-card';

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
});
