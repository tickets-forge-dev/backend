export interface Estimate {
  min: number; // hours
  max: number; // hours
  confidence: 'low' | 'medium' | 'high';
  drivers: string[]; // Top 3 factors
}
