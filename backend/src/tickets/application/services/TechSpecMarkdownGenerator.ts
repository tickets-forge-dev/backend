import { Injectable } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import {
  TechSpec,
  SolutionSection,
  SolutionStep,
  AcceptanceCriterion,
  FileChange,
  ApiChanges,
  LayeredFileChanges,
  TestCase,
  TestPlan,
  PackageDependency,
} from '../../domain/tech-spec/TechSpecGenerator';

/**
 * Generates a complete Markdown document from an AEC's TechSpec.
 *
 * Pure transformer — no async, no external deps, no side effects.
 * Handles polymorphic fields (string | object | array) gracefully.
 */
@Injectable()
export class TechSpecMarkdownGenerator {
  generate(aec: AEC, sections?: string[]): string {
    const spec = aec.techSpec;
    if (!spec) return '';

    const lines: string[] = [];
    const includedSections = sections && sections.length > 0 ? new Set(sections) : null;

    this.renderHeader(lines, aec, spec);

    if (!includedSections || includedSections.has('problem')) {
      this.renderProblemStatement(lines, spec.problemStatement);
    }
    if (!includedSections || includedSections.has('solution')) {
      this.renderSolution(lines, spec.solution);
    }
    if (!includedSections || includedSections.has('criteria')) {
      this.renderAcceptanceCriteria(lines, spec.acceptanceCriteria);
    }
    if (!includedSections || includedSections.has('files')) {
      this.renderFileChanges(lines, spec.fileChanges, spec.layeredFileChanges);
    }
    if (!includedSections || includedSections.has('api')) {
      this.renderApiEndpoints(lines, spec.apiChanges);
    }
    if (!includedSections || includedSections.has('dependencies')) {
      this.renderDependencies(lines, spec.dependencies);
    }
    if (!includedSections || includedSections.has('tests')) {
      this.renderTestPlan(lines, spec.testPlan);
    }
    if (!includedSections || includedSections.has('scope')) {
      this.renderScope(lines, spec.inScope, spec.outOfScope);
    }

    return lines.join('\n');
  }

  // ── Header ──────────────────────────────────────────────────────────

  private renderHeader(lines: string[], aec: AEC, spec: TechSpec): void {
    lines.push(`# ${spec.title || aec.title}`);
    lines.push('');

    const meta: string[] = [];
    meta.push(`**Date:** ${spec.createdAt ? toSafeISODate(spec.createdAt) : 'N/A'}`);

    lines.push(meta.join('  \n'));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // ── Problem Statement ───────────────────────────────────────────────

  private renderProblemStatement(lines: string[], raw: unknown): void {
    const ps = this.normalizeProblemStatement(raw);
    if (!ps.narrative) return;

    lines.push('## Problem Statement');
    lines.push('');
    lines.push(ps.narrative);
    lines.push('');

    if (ps.whyItMatters) {
      lines.push('### Why It Matters');
      lines.push('');
      lines.push(ps.whyItMatters);
      lines.push('');
    }

    if (ps.assumptions.length > 0) {
      lines.push('### Assumptions');
      lines.push('');
      for (const a of ps.assumptions) {
        lines.push(`- ${a}`);
      }
      lines.push('');
    }

    if (ps.constraints.length > 0) {
      lines.push('### Constraints');
      lines.push('');
      for (const c of ps.constraints) {
        lines.push(`- ${c}`);
      }
      lines.push('');
    }
  }

  // ── Solution ────────────────────────────────────────────────────────

  private renderSolution(lines: string[], solution: unknown): void {
    if (!solution) return;

    lines.push('## Solution');
    lines.push('');

    if (typeof solution === 'string') {
      lines.push(solution);
      lines.push('');
      return;
    }

    if (Array.isArray(solution)) {
      for (let i = 0; i < solution.length; i++) {
        const step = solution[i];
        const desc = typeof step === 'string' ? step : (step as any).description || JSON.stringify(step);
        lines.push(`${i + 1}. ${desc}`);
        this.renderStepMeta(lines, step);
      }
      lines.push('');
      return;
    }

    const sol = solution as SolutionSection;
    if (sol.overview) {
      lines.push(sol.overview);
      lines.push('');
    }

    if (sol.steps?.length > 0) {
      lines.push('### Steps');
      lines.push('');
      for (let i = 0; i < sol.steps.length; i++) {
        const step = sol.steps[i];
        lines.push(`${step.order || i + 1}. ${step.description}`);
        this.renderStepMeta(lines, step);
      }
      lines.push('');
    }

    if (sol.fileChanges) {
      if (sol.fileChanges.create?.length > 0) {
        lines.push('**Files to create:** ' + sol.fileChanges.create.map((f) => `\`${f}\``).join(', '));
      }
      if (sol.fileChanges.modify?.length > 0) {
        lines.push('**Files to modify:** ' + sol.fileChanges.modify.map((f) => `\`${f}\``).join(', '));
      }
      if (sol.fileChanges.delete && sol.fileChanges.delete.length > 0) {
        lines.push('**Files to delete:** ' + sol.fileChanges.delete.map((f) => `\`${f}\``).join(', '));
      }
      lines.push('');
    }
  }

  private renderStepMeta(lines: string[], step: unknown): void {
    if (typeof step !== 'object' || step === null) return;
    const s = step as SolutionStep;
    if (s.file) {
      const loc = s.lineNumbers ? `:${s.lineNumbers[0]}-${s.lineNumbers[1]}` : '';
      lines.push(`   - File: \`${s.file}${loc}\``);
    }
  }

  // ── Acceptance Criteria ─────────────────────────────────────────────

  private renderAcceptanceCriteria(lines: string[], criteria: unknown[]): void {
    if (!criteria || criteria.length === 0) return;

    lines.push('## Acceptance Criteria');
    lines.push('');

    for (let i = 0; i < criteria.length; i++) {
      const ac = criteria[i];
      if (typeof ac === 'string') {
        lines.push(`${i + 1}. ${ac}`);
      } else {
        const c = ac as AcceptanceCriterion;
        lines.push(`### AC-${i + 1}`);
        lines.push('');
        lines.push(`- **Given** ${c.given}`);
        lines.push(`- **When** ${c.when}`);
        lines.push(`- **Then** ${c.then}`);
        if (c.implementationNotes) {
          lines.push(`- *Note:* ${c.implementationNotes}`);
        }
      }
    }

    lines.push('');
  }

  // ── File Changes ────────────────────────────────────────────────────

  private renderFileChanges(
    lines: string[],
    fileChanges?: FileChange[],
    layered?: LayeredFileChanges,
  ): void {
    if (layered) {
      this.renderLayeredFileChanges(lines, layered);
    } else if (fileChanges && fileChanges.length > 0) {
      this.renderFlatFileChanges(lines, fileChanges);
    }
  }

  private renderFlatFileChanges(lines: string[], changes: FileChange[]): void {
    lines.push('## File Changes');
    lines.push('');
    lines.push('| Path | Action |');
    lines.push('|------|--------|');
    for (const fc of changes) {
      const action = (fc as any).action || (fc as any).type || 'modify';
      lines.push(`| \`${fc.path}\` | ${action} |`);
    }
    lines.push('');
  }

  private renderLayeredFileChanges(lines: string[], layered: LayeredFileChanges): void {
    lines.push('## File Changes');
    lines.push('');

    const layers: [string, FileChange[]][] = [
      ['Backend', layered.backend],
      ['Frontend', layered.frontend],
      ['Shared', layered.shared],
      ['Infrastructure', layered.infrastructure],
      ['Documentation', layered.documentation],
    ];

    for (const [label, files] of layers) {
      if (!files || files.length === 0) continue;
      lines.push(`### ${label}`);
      lines.push('');
      lines.push('| Path | Action |');
      lines.push('|------|--------|');
      for (const fc of files) {
        const action = (fc as any).action || (fc as any).type || 'modify';
        lines.push(`| \`${fc.path}\` | ${action} |`);
      }
      lines.push('');
    }
  }

  // ── API Endpoints ───────────────────────────────────────────────────

  private renderApiEndpoints(lines: string[], apiChanges?: ApiChanges): void {
    if (!apiChanges?.endpoints || apiChanges.endpoints.length === 0) return;

    lines.push('## API Endpoints');
    lines.push('');
    lines.push('| Method | Route | Description | Auth | Status |');
    lines.push('|--------|-------|-------------|------|--------|');
    for (const ep of apiChanges.endpoints) {
      lines.push(
        `| ${ep.method} | \`${ep.route}\` | ${ep.description || ''} | ${ep.authentication || 'none'} | ${ep.status || ''} |`,
      );
    }
    lines.push('');
  }

  // ── Dependencies & Packages ─────────────────────────────────────────

  private renderDependencies(lines: string[], dependencies?: PackageDependency[]): void {
    if (!dependencies || dependencies.length === 0) return;

    lines.push('## Dependencies & Packages');
    lines.push('');
    lines.push('| Package | Version | Type | Purpose |');
    lines.push('|---------|---------|------|---------|');
    for (const dep of dependencies) {
      const version = dep.version || 'latest';
      const type = dep.type === 'production' ? 'prod' : 'dev';
      lines.push(
        `| \`${dep.name}\` | ${version} | ${type} | ${dep.purpose} |`,
      );
    }
    lines.push('');

    // Add install commands section
    lines.push('### Installation');
    lines.push('');
    lines.push('```bash');
    for (const dep of dependencies) {
      if (dep.installCommand) {
        lines.push(dep.installCommand);
      } else {
        lines.push(`npm install ${dep.name}${dep.version ? `@${dep.version}` : ''}`);
      }
    }
    lines.push('```');
    lines.push('');

    // Add documentation links if available
    const withDocs = dependencies.filter(d => d.documentationUrl);
    if (withDocs.length > 0) {
      lines.push('### Documentation');
      lines.push('');
      for (const dep of withDocs) {
        lines.push(`- [${dep.name}](${dep.documentationUrl})`);
      }
      lines.push('');
    }

    // Add alternatives if available
    const withAlternatives = dependencies.filter(d => d.alternativesConsidered && d.alternativesConsidered.length > 0);
    if (withAlternatives.length > 0) {
      lines.push('### Alternatives Considered');
      lines.push('');
      for (const dep of withAlternatives) {
        lines.push(`- **${dep.name}**: ${dep.alternativesConsidered!.join(', ')}`);
      }
      lines.push('');
    }
  }

  // ── Test Plan ───────────────────────────────────────────────────────

  private renderTestPlan(lines: string[], testPlan?: TestPlan): void {
    if (!testPlan) return;

    lines.push('## Test Plan');
    lines.push('');

    if (testPlan.summary) {
      lines.push(testPlan.summary);
      lines.push('');
    }

    if (testPlan.coverageGoal) {
      lines.push(`**Coverage Goal:** ${testPlan.coverageGoal}%`);
      lines.push('');
    }

    this.renderTestGroup(lines, 'Unit Tests', testPlan.unitTests);
    this.renderTestGroup(lines, 'Integration Tests', testPlan.integrationTests);
    this.renderTestGroup(lines, 'Edge Cases', testPlan.edgeCases);

    if (testPlan.testingNotes) {
      lines.push('### Testing Notes');
      lines.push('');
      lines.push(testPlan.testingNotes);
      lines.push('');
    }
  }

  private renderTestGroup(lines: string[], title: string, tests?: TestCase[]): void {
    if (!tests || tests.length === 0) return;

    lines.push(`### ${title}`);
    lines.push('');
    for (const tc of tests) {
      lines.push(`- **${tc.testName}** (\`${tc.testFile}\`)`);
      lines.push(`  ${tc.description}`);
    }
    lines.push('');
  }

  // ── Scope ───────────────────────────────────────────────────────────

  private renderScope(lines: string[], inScope?: string[], outOfScope?: string[]): void {
    if ((!inScope || inScope.length === 0) && (!outOfScope || outOfScope.length === 0)) return;

    lines.push('## Scope');
    lines.push('');

    if (inScope && inScope.length > 0) {
      lines.push('### In Scope');
      lines.push('');
      for (const item of inScope) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    if (outOfScope && outOfScope.length > 0) {
      lines.push('### Out of Scope');
      lines.push('');
      for (const item of outOfScope) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private normalizeProblemStatement(raw: unknown): {
    narrative: string;
    whyItMatters: string;
    assumptions: string[];
    constraints: string[];
  } {
    const empty = { narrative: '', whyItMatters: '', assumptions: [], constraints: [] };
    if (!raw) return empty;

    // If it's a string, try to parse as JSON first
    let value = raw;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          value = JSON.parse(trimmed);
        } catch {
          return { ...empty, narrative: raw };
        }
      } else {
        return { ...empty, narrative: raw };
      }
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;

      // Happy path: has the expected shape
      if (typeof obj.narrative === 'string' && obj.narrative.length > 0) {
        return {
          narrative: sanitizeNarrativeField(obj.narrative),
          whyItMatters: typeof obj.whyItMatters === 'string' ? sanitizeNarrativeField(obj.whyItMatters) : '',
          assumptions: Array.isArray(obj.assumptions)
            ? obj.assumptions.filter((v): v is string => typeof v === 'string')
            : [],
          constraints: Array.isArray(obj.constraints)
            ? obj.constraints.filter((v): v is string => typeof v === 'string')
            : [],
        };
      }

      // Recovery: extract meaningful strings from arbitrary structure
      const strings = collectStrings(value);
      const arrays = collectStringArrays(value);

      return {
        narrative: strings[0] || '',
        whyItMatters: strings[1] || '',
        assumptions: arrays[0] || [],
        constraints: arrays[1] || [],
      };
    }

    return empty;
  }
}

/**
 * Detect when a narrative field contains raw JSON and extract readable text.
 * LLMs sometimes echo the user's JSON input into narrative fields.
 */
function sanitizeNarrativeField(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const strings = collectStrings(parsed);
    if (strings.length > 0) {
      return strings.slice(0, 3).join('. ');
    }
    return value;
  } catch {
    return value;
  }
}

/** Recursively extract meaningful strings (>10 chars) from any value. */
function collectStrings(value: unknown, maxDepth = 5): string[] {
  if (!value || maxDepth <= 0) return [];
  if (typeof value === 'string' && value.length > 10) return [value];
  if (Array.isArray(value)) {
    return value.flatMap((v) => collectStrings(v, maxDepth - 1));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((v) => collectStrings(v, maxDepth - 1));
  }
  return [];
}

/** Recursively find arrays of strings from any value. */
function collectStringArrays(value: unknown, maxDepth = 5): string[][] {
  if (!value || maxDepth <= 0) return [];
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string')) {
    return [value as string[]];
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.values(value).flatMap((v) => collectStringArrays(v, maxDepth - 1));
  }
  return [];
}

/** Safely convert a Date, Firestore Timestamp, or {_seconds} object to YYYY-MM-DD */
function toSafeISODate(value: unknown): string {
  try {
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'object' && value !== null) {
      const v = value as any;
      if (typeof v.toDate === 'function') return v.toDate().toISOString().split('T')[0];
      if (typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString().split('T')[0];
    }
    if (typeof value === 'string') return new Date(value).toISOString().split('T')[0];
    return 'N/A';
  } catch {
    return 'N/A';
  }
}
