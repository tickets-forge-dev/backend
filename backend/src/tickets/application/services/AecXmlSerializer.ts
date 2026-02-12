import { Injectable } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import {
  TechSpec,
  AcceptanceCriterion,
  FileChange,
  TestCase,
} from '../../domain/tech-spec/TechSpecGenerator';

/**
 * Serializes an AEC aggregate into an XML contract document.
 *
 * Pure transformer — no async, no external deps.
 * Output is a self-contained XML string consumable by AI agents.
 */
@Injectable()
export class AecXmlSerializer {
  serialize(aec: AEC): string {
    const spec = aec.techSpec;
    if (!spec) return '';

    const b = new XmlBuilder();
    b.pi('xml', 'version="1.0" encoding="UTF-8"');
    b.open('ticket', { version: '1.0' });

    this.writeMetadata(b, aec, spec);
    this.writeSpecification(b, spec);
    this.writeImplementation(b, spec);
    this.writeAcceptanceCriteria(b, spec.acceptanceCriteria);

    b.close('ticket');
    return b.toString();
  }

  // ── Metadata ────────────────────────────────────────────────────────

  private writeMetadata(b: XmlBuilder, aec: AEC, spec: TechSpec): void {
    b.open('metadata');
    b.leaf('id', aec.id);
    b.leaf('title', spec.title || aec.title);
    b.leaf('type', aec.type || 'feature');
    b.leaf('priority', aec.priority || 'medium');
    b.leaf('status', aec.status);
    b.leaf('qualityScore', String(spec.qualityScore ?? 0));
    b.leaf('createdAt', spec.createdAt ? toSafeISO(spec.createdAt) : '');

    if (aec.repositoryContext) {
      b.leaf('repository', aec.repositoryContext.repositoryFullName);
      b.leaf('branch', aec.repositoryContext.branchName);
    }

    if (spec.stack) {
      b.open('stack');
      if (spec.stack.language) b.leaf('language', spec.stack.language);
      if (spec.stack.framework) b.leaf('framework', spec.stack.framework);
      if (spec.stack.packageManager) b.leaf('packageManager', spec.stack.packageManager);
      b.close('stack');
    }

    b.close('metadata');
  }

  // ── Specification ───────────────────────────────────────────────────

  private writeSpecification(b: XmlBuilder, spec: TechSpec): void {
    b.open('specification');

    // Problem statement
    this.writeProblemStatement(b, spec.problemStatement);

    // Solution
    this.writeSolution(b, spec.solution);

    // Scope
    if (spec.inScope?.length || spec.outOfScope?.length) {
      b.open('scope');
      if (spec.inScope) {
        for (const item of spec.inScope) {
          b.leaf('inScope', item);
        }
      }
      if (spec.outOfScope) {
        for (const item of spec.outOfScope) {
          b.leaf('outOfScope', item);
        }
      }
      b.close('scope');
    }

    b.close('specification');
  }

  private writeProblemStatement(b: XmlBuilder, raw: unknown): void {
    if (!raw) return;

    b.open('problemStatement');

    const ps = normalizeProblemStatement(raw);
    if (ps.narrative) b.cdata('narrative', ps.narrative);
    if (ps.whyItMatters) b.cdata('whyItMatters', ps.whyItMatters);
    for (const a of ps.assumptions) {
      b.leaf('assumption', a);
    }
    for (const c of ps.constraints) {
      b.leaf('constraint', c);
    }

    b.close('problemStatement');
  }

  private writeSolution(b: XmlBuilder, solution: unknown): void {
    if (!solution) return;

    b.open('solution');

    if (typeof solution === 'string') {
      b.cdata('overview', solution);
    } else if (Array.isArray(solution)) {
      for (let i = 0; i < solution.length; i++) {
        const step = solution[i];
        const desc = typeof step === 'string' ? step : (step as any).description || '';
        b.open('step', { order: String(i + 1) });
        b.leaf('description', desc);
        if (typeof step === 'object' && step?.file) {
          b.leaf('file', step.file);
        }
        b.close('step');
      }
    } else {
      const sol = solution as any;
      if (sol.overview) b.cdata('overview', sol.overview);
      if (sol.steps?.length) {
        for (let i = 0; i < sol.steps.length; i++) {
          const step = sol.steps[i];
          b.open('step', { order: String(step.order || i + 1) });
          b.leaf('description', step.description || '');
          if (step.file) b.leaf('file', step.file);
          b.close('step');
        }
      }
    }

    b.close('solution');
  }

  // ── Implementation ──────────────────────────────────────────────────

  private writeImplementation(b: XmlBuilder, spec: TechSpec): void {
    b.open('implementation');

    // Files
    const files = spec.layeredFileChanges
      ? this.flattenLayered(spec.layeredFileChanges)
      : spec.fileChanges || [];

    if (files.length > 0) {
      b.open('files');
      for (const fc of files) {
        const action = (fc as any).action || (fc as any).type || 'modify';
        b.leaf('file', fc.path, { action, layer: (fc as any).layer || '' });
      }
      b.close('files');
    }

    // APIs
    if (spec.apiChanges?.endpoints?.length) {
      b.open('apis');
      for (const ep of spec.apiChanges.endpoints) {
        b.open('endpoint', {
          method: ep.method,
          route: ep.route,
          auth: ep.authentication || 'none',
          status: ep.status || '',
        });
        b.leaf('description', ep.description || '');
        if (ep.dto?.request) b.leaf('requestDto', ep.dto.request);
        if (ep.dto?.response) b.leaf('responseDto', ep.dto.response);
        b.close('endpoint');
      }
      b.close('apis');
    }

    // Test plan
    if (spec.testPlan) {
      b.open('testPlan');
      if (spec.testPlan.summary) b.leaf('summary', spec.testPlan.summary);
      this.writeTests(b, 'unitTests', spec.testPlan.unitTests);
      this.writeTests(b, 'integrationTests', spec.testPlan.integrationTests);
      this.writeTests(b, 'edgeCases', spec.testPlan.edgeCases);
      b.close('testPlan');
    }

    b.close('implementation');
  }

  private writeTests(b: XmlBuilder, groupName: string, tests?: TestCase[]): void {
    if (!tests || tests.length === 0) return;
    b.open(groupName);
    for (const tc of tests) {
      b.open('test', { type: tc.type });
      b.leaf('name', tc.testName || '');
      b.leaf('file', tc.testFile || '');
      b.leaf('description', tc.description || '');
      b.close('test');
    }
    b.close(groupName);
  }

  // ── Acceptance Criteria ─────────────────────────────────────────────

  private writeAcceptanceCriteria(b: XmlBuilder, criteria: unknown[]): void {
    if (!criteria || criteria.length === 0) return;

    b.open('acceptanceCriteria');
    for (let i = 0; i < criteria.length; i++) {
      const ac = criteria[i];
      if (typeof ac === 'string') {
        b.leaf('criterion', ac, { id: `AC-${i + 1}` });
      } else {
        const c = ac as AcceptanceCriterion;
        b.open('criterion', { id: `AC-${i + 1}` });
        b.leaf('given', c.given || '');
        b.leaf('when', c.when || '');
        b.leaf('then', c.then || '');
        if (c.implementationNotes) b.leaf('notes', c.implementationNotes);
        b.close('criterion');
      }
    }
    b.close('acceptanceCriteria');
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private flattenLayered(layered: any): (FileChange & { layer?: string })[] {
    const result: (FileChange & { layer?: string })[] = [];
    const layers: [string, FileChange[]][] = [
      ['backend', layered.backend || []],
      ['frontend', layered.frontend || []],
      ['shared', layered.shared || []],
      ['infrastructure', layered.infrastructure || []],
      ['documentation', layered.documentation || []],
    ];
    for (const [layer, files] of layers) {
      for (const fc of files) {
        result.push({ ...fc, layer });
      }
    }
    return result;
  }
}

// ── Internal XmlBuilder ───────────────────────────────────────────────

class XmlBuilder {
  private lines: string[] = [];
  private indent = 0;

  pi(target: string, attrs: string): void {
    this.lines.push(`<?${target} ${attrs}?>`);
  }

  open(tag: string, attrs?: Record<string, string>): void {
    this.lines.push(this.pad() + `<${tag}${this.renderAttrs(attrs)}>`);
    this.indent++;
  }

  close(tag: string): void {
    this.indent--;
    this.lines.push(this.pad() + `</${tag}>`);
  }

  leaf(tag: string, text: string, attrs?: Record<string, string>): void {
    const escaped = escapeXml(text);
    this.lines.push(this.pad() + `<${tag}${this.renderAttrs(attrs)}>${escaped}</${tag}>`);
  }

  cdata(tag: string, text: unknown): void {
    const str = text == null ? '' : String(text);
    // Escape ]]> inside CDATA by splitting into two CDATA sections
    const safe = str.replace(/]]>/g, ']]]]><![CDATA[>');
    this.lines.push(this.pad() + `<${tag}><![CDATA[${safe}]]></${tag}>`);
  }

  toString(): string {
    return this.lines.join('\n');
  }

  private pad(): string {
    return '  '.repeat(this.indent);
  }

  private renderAttrs(attrs?: Record<string, string>): string {
    if (!attrs) return '';
    const parts = Object.entries(attrs)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}="${escapeXml(v)}"`);
    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }
}

/** Normalize a polymorphic problemStatement into a predictable shape. */
function normalizeProblemStatement(raw: unknown): {
  narrative: string;
  whyItMatters: string;
  assumptions: string[];
  constraints: string[];
} {
  const empty = { narrative: '', whyItMatters: '', assumptions: [], constraints: [] };
  if (!raw) return empty;

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

function sanitizeNarrativeField(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    const parsed = JSON.parse(trimmed);
    const strings = collectStrings(parsed);
    return strings.length > 0 ? strings.slice(0, 3).join('. ') : value;
  } catch {
    return value;
  }
}

function collectStrings(value: unknown, maxDepth = 5): string[] {
  if (!value || maxDepth <= 0) return [];
  if (typeof value === 'string' && value.length > 10) return [value];
  if (Array.isArray(value)) return value.flatMap((v) => collectStrings(v, maxDepth - 1));
  if (typeof value === 'object' && value !== null)
    return Object.values(value).flatMap((v) => collectStrings(v, maxDepth - 1));
  return [];
}

function collectStringArrays(value: unknown, maxDepth = 5): string[][] {
  if (!value || maxDepth <= 0) return [];
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string'))
    return [value as string[]];
  if (typeof value === 'object' && value !== null && !Array.isArray(value))
    return Object.values(value).flatMap((v) => collectStringArrays(v, maxDepth - 1));
  return [];
}

function escapeXml(s: unknown): string {
  const str = s == null ? '' : String(s);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Safely convert a Date, Firestore Timestamp, or {_seconds} object to ISO string */
function toSafeISO(value: unknown): string {
  try {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object' && value !== null) {
      const v = value as any;
      if (typeof v.toDate === 'function') return v.toDate().toISOString();
      if (typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
    }
    if (typeof value === 'string') return new Date(value).toISOString();
    return '';
  } catch {
    return '';
  }
}
