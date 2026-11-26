import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

/** jsdom has no ResizeObserver; Radix primitives (Slider) only need it to exist. */
class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
globalThis.ResizeObserver ??= ResizeObserverStub;
