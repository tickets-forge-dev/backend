import { TechSpecGenerator } from '../../domain/tech-spec/TechSpecGenerator';

export const TECH_SPEC_GENERATOR = Symbol('TechSpecGenerator');

// Re-export the interface for convenience
export type TechSpecGeneratorPort = TechSpecGenerator;
