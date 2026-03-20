export interface GenerationProgressCallback {
  onPhaseUpdate(phase: string, percent: number): Promise<void>;
  isCancelled(): Promise<boolean>;
}
