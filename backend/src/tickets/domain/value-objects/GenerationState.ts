export interface GenerationStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  details?: string;
  error?: string;
}

export interface GenerationState {
  currentStep: number;
  steps: GenerationStep[];
}

export class GenerationStateFactory {
  static initial(): GenerationState {
    return {
      currentStep: 1,
      steps: [
        { id: 1, title: 'Intent extraction', status: 'pending' },
        { id: 2, title: 'Type detection', status: 'pending' },
        { id: 3, title: 'Repo index query', status: 'pending' },
        { id: 4, title: 'API snapshot resolution', status: 'pending' },
        { id: 5, title: 'Ticket drafting', status: 'pending' },
        { id: 6, title: 'Validation', status: 'pending' },
        { id: 7, title: 'Question prep', status: 'pending' },
        { id: 8, title: 'Estimation', status: 'pending' },
      ],
    };
  }
}
