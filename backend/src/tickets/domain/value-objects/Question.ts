export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'binary' | 'multi-choice';
  options: QuestionOption[];
  answer?: string;
  defaultAssumption?: string;
}
