/**
 * useServices Hook
 *
 * Wrapper around the lazy-initialized service instances from @/services/index.
 * Ensures the same singleton instances are used throughout the application,
 * both in React components and Zustand stores.
 *
 * This prevents service duplication and state inconsistency.
 */

import { useServices as getServices } from '@/services/index';

export function useServices() {
  return getServices();
}
