import { CodebaseAnalyzer } from '@tickets/domain/pattern-analysis/CodebaseAnalyzer';

export const CODEBASE_ANALYZER = Symbol('CODEBASE_ANALYZER');

export type CodebaseAnalyzerPort = CodebaseAnalyzer;
