import { ProjectStackDetector } from '@tickets/domain/stack-detection/ProjectStackDetector';

export const PROJECT_STACK_DETECTOR = Symbol('PROJECT_STACK_DETECTOR');

export type ProjectStackDetectorPort = ProjectStackDetector;
