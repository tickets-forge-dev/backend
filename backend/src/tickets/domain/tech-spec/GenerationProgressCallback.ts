/**
 * Callback interface for reporting generation progress and checking cancellation.
 * Defined in the tickets domain so TechSpecGenerator can use it without
 * depending on the jobs module.
 */
export interface GenerationProgressCallback {
  onPhaseUpdate(phase: string, percent: number): Promise<void>;
  isCancelled(): Promise<boolean>;
}
