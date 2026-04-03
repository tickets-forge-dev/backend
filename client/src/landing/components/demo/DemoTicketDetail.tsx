// DemoTicketDetail.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Zap, FileText, Palette, Code2, ChevronDown, Hash, Circle } from 'lucide-react';
import { DEMO_TICKETS, DEMO_TAGS, DEMO_TICKET_SPEC } from './demo-data';

interface Props {
  onBack: () => void;
  onStartDevelop: () => void;
  hasInteracted: boolean;
  developComplete: boolean;
}

const LIFECYCLE_STEPS = ['Draft', 'Defined', 'Refined', 'Approved', 'Executing', 'Delivered'];
const CURRENT_STEP_IDX = 3; // Approved

type Tab = 'spec' | 'design' | 'technical';

export function DemoTicketDetail({ onBack, onStartDevelop, hasInteracted, developComplete }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('spec');
  const ticket = DEMO_TICKETS['t1'];
  const tags = ticket.tagIds.map((id) => DEMO_TAGS.find((t) => t.id === id)).filter(Boolean);
  const spec = DEMO_TICKET_SPEC;

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: 'spec', label: 'Spec', icon: FileText },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'technical', label: 'Technical', icon: Code2 },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          {/* Develop button */}
          <button
            onClick={onStartDevelop}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              developComplete
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--bg-active)]'
            }`}
          >
            {!hasInteracted && !developComplete && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            )}
            <Zap className={`w-3.5 h-3.5 ${developComplete ? '' : 'text-emerald-500'}`} />
            {developComplete ? 'View Development' : 'Develop'}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-[15px] font-medium text-[var(--text-secondary)] leading-snug">
          {ticket.title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]">
            <Hash className="h-3 w-3" />
            {ticket.slug}
          </span>
          <span className="text-[var(--text-tertiary)]/30">·</span>
          {tags.map((tag) => tag && (
            <span key={tag.id} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
              tag.color === 'green' ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-500'
            }`}>
              {tag.name}
            </span>
          ))}
          <span className="text-[var(--text-tertiary)]/30">·</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">Created by Alex Kim</span>
        </div>

        {/* Overview card */}
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Assignee */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-medium text-violet-400">
                AK
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Alex Kim</span>
            </div>
            {/* Progress dots + Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {LIFECYCLE_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-colors ${i <= CURRENT_STEP_IDX ? 'w-4 bg-blue-500' : 'w-1.5 bg-[var(--text-tertiary)]/20'}`} />
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border-subtle)]">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-[var(--text)] border-[var(--text)]'
                    : 'text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="pb-6">
          {activeTab === 'spec' && (
            <div className="divide-y divide-[var(--border-subtle)] [&>*]:py-3 [&>*:first-child]:pt-0">
              {/* Problem Statement */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Problem Statement
                </h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  {spec.problemStatement.narrative}
                </p>
                <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase mb-1">Why it matters</p>
                  <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">{spec.problemStatement.whyItMatters}</p>
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Acceptance Criteria <span className="text-[var(--text-tertiary)] font-normal">({spec.acceptanceCriteria.length})</span>
                </h3>
                <ul className="space-y-2">
                  {spec.acceptanceCriteria.map((ac, idx) => (
                    <li key={idx} className="bg-[var(--bg-subtle)] rounded-lg px-4 py-3 space-y-1 text-[13px] text-[var(--text-secondary)]">
                      <p><span className="font-semibold text-[var(--text)] mr-1">Given</span>{ac.given}</p>
                      <p><span className="font-semibold text-[var(--text)] mr-1">When</span>{ac.when}</p>
                      <p><span className="font-semibold text-[var(--text)] mr-1">Then</span>{ac.then}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scope */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                    <h4 className="text-[10px] font-medium text-[var(--text)] uppercase">In Scope</h4>
                    <ul className="space-y-1 text-[12px] text-[var(--text-secondary)]">
                      {spec.inScope.map((item, i) => (
                        <li key={i}><span className="text-[var(--text-tertiary)] mr-2">-</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-hover)] p-3 space-y-2">
                    <h4 className="text-[10px] font-medium text-[var(--text)] uppercase">Out of Scope</h4>
                    <ul className="space-y-1 text-[12px] text-[var(--text-secondary)]">
                      {spec.outOfScope.map((item, i) => (
                        <li key={i}><span className="text-[var(--text-tertiary)] mr-2">-</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Solution Steps */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Solution
                </h3>
                <ol className="space-y-3">
                  {spec.solution.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-[13px]">
                      <span className="text-[var(--text-tertiary)] font-mono text-[11px] mt-0.5 flex-shrink-0">{idx + 1}.</span>
                      <div>
                        <p className="font-medium text-[var(--text)]">{step.title}</p>
                        <p className="text-[var(--text-secondary)] text-[12px] mt-0.5">{step.description}</p>
                        {step.file && (
                          <code className="text-[11px] text-violet-400 font-mono mt-0.5 inline-block">{step.file}</code>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)]">
                Design References <span className="text-[var(--text-tertiary)] font-normal">(1)</span>
              </h3>
              <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                <img
                  src="/images/demo/demo-prototype.png"
                  alt="API Rate Limiter Settings Panel mockup"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Settings panel mockup — configuration view for the rate limiter
              </p>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="divide-y divide-[var(--border-subtle)] [&>*]:py-3 [&>*:first-child]:pt-0">
              {/* API Endpoints */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  API Endpoints
                </h3>
                {spec.apiEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
                    <span className="font-mono font-medium text-emerald-400">{ep.method}</span>
                    <span className="font-mono text-[var(--text-secondary)]">{ep.route}</span>
                    <span className="text-[var(--text-tertiary)] ml-2">— {ep.description}</span>
                  </div>
                ))}
              </div>
              {/* Dependencies */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Dependencies
                </h3>
                <ul className="space-y-1">
                  {spec.dependencies.map((dep, i) => (
                    <li key={i} className="text-[12px] font-mono text-violet-400">{dep}</li>
                  ))}
                </ul>
              </div>
              {/* Test Plan */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text)] pl-3 border-l-2 border-[var(--text-tertiary)] mb-2">
                  Test Plan
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{spec.testPlan}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
