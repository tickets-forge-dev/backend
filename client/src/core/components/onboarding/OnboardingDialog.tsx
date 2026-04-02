'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useSettingsStore } from '@/stores/settings.store';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import {
  Pencil, MessageCircle, ShieldCheck, FileCode, Globe, Terminal,
  Shield, ChevronDown, Sparkles, Cloud, GitPullRequest, Play,
  ClipboardList, ArrowRight, Zap, Eye,
} from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Create' },
  { id: 2, label: 'Refine' },
  { id: 3, label: 'Develop' },
  { id: 4, label: 'Track' },
  { id: 5, label: 'Connect' },
] as const;

function PrivacyNote() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 max-w-[480px] mx-auto">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <Shield className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
        <p className="text-[12px] leading-relaxed">
          We never clone your repository. Your code stays on GitHub.
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-0.5 flex-shrink-0"
        >
          {expanded ? 'Less' : 'More'}
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="mt-3 rounded-lg bg-[var(--bg-subtle)] p-4 text-[12px] text-[var(--text-tertiary)] leading-relaxed space-y-2">
          <p>
            forge uses the GitHub API to read your repository&apos;s file tree and selected source files. We request <strong className="text-[var(--text-secondary)]">read-only</strong> access and never write, push, or clone anything.
          </p>
          <p>
            You can disconnect at any time from Settings and we&apos;ll revoke all access immediately.
          </p>
        </div>
      )}
    </div>
  );
}

export function OnboardingDialog() {
  const { onboardingCompleted, completeOnboarding } = useUIStore();
  const githubConnected = useSettingsStore((s) => s.githubConnected);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (onboardingCompleted) return;

    const params = new URLSearchParams(window.location.search);
    const oauthOrigin = localStorage.getItem('forge-oauth-origin');

    if (params.get('connected') === 'true' && oauthOrigin === 'onboarding') {
      localStorage.removeItem('forge-oauth-origin');
      window.history.replaceState({}, '', window.location.pathname);
      setStep(5); // Jump to Connect step
      setOpen(true);
    } else if (params.get('error') && oauthOrigin === 'onboarding') {
      localStorage.removeItem('forge-oauth-origin');
      window.history.replaceState({}, '', window.location.pathname);
      setStep(5);
      setOpen(true);
    } else {
      const timer = setTimeout(() => setOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    setOpen(false);
  }, [completeOnboarding]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
    setOpen(false);
  }, [completeOnboarding]);

  const handleBeforeConnect = useCallback(() => {
    localStorage.setItem('forge-oauth-origin', 'onboarding');
  }, []);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (onboardingCompleted) return null;

  const isLastStep = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border border-[var(--border-subtle)] shadow-2xl [&>button]:hidden !flex !flex-col"
        style={{
          width: '620px',
          maxWidth: '95vw',
          height: '540px',
          maxHeight: '90vh',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '16px',
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Onboarding</DialogTitle>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-2 shrink-0">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className="h-1.5 rounded-full transition-all duration-300 hover:opacity-80"
              style={{
                width: s.id === step ? 28 : 8,
                backgroundColor: s.id === step ? '#8b5cf6' : s.id < step ? '#8b5cf644' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepCreateTicket />}
          {step === 2 && <StepRefinement />}
          {step === 3 && <StepDevelop />}
          {step === 4 && <StepTrackPreview />}
          {step === 5 && <StepConnect onBeforeConnect={handleBeforeConnect} />}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-[var(--border-subtle)] shrink-0">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-[var(--text-tertiary)] text-[12px]">
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-[12px]">
                Back
              </Button>
            )}
            {!isLastStep ? (
              <Button size="sm" onClick={handleNext} className="text-[12px] gap-1.5">
                Next
                <ArrowRight className="w-3 h-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete} className="text-[12px]">
                {githubConnected ? 'Get Started' : 'Skip & Start'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ━━━ Step Components ━━━ */

function StepWelcome() {
  return (
    <div className="text-center animate-in fade-in duration-200 h-full flex flex-col items-center justify-center">
      <div className="flex justify-center mb-4">
        <img src="/forge-icon.png" alt="forge" width={48} height={48} className="rounded-xl" />
      </div>
      <h2 className="text-[22px] font-bold text-[var(--text)] tracking-tight mb-2">
        Welcome to Forge
      </h2>
      <p className="text-[14px] text-[var(--text-secondary)] mb-1">
        From idea to pull request — without writing code.
      </p>
      <p className="text-[13px] text-[var(--text-tertiary)] max-w-[400px] mx-auto leading-relaxed mb-8">
        Forge turns rough ideas into production-ready specs, then implements them
        in a cloud sandbox. PMs ship features. Developers review code.
      </p>

      {/* Three pillars */}
      <div className="grid grid-cols-3 gap-3 max-w-[460px] mx-auto w-full">
        {[
          { icon: <Sparkles className="w-4 h-4 text-violet-400" />, label: 'AI-powered specs', sub: 'Structured & complete' },
          { icon: <Cloud className="w-4 h-4 text-emerald-400" />, label: 'Cloud Develop', sub: 'One-click implementation' },
          { icon: <ClipboardList className="w-4 h-4 text-blue-400" />, label: 'Change Records', sub: 'Full audit trail' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-[var(--bg-subtle)] p-3 text-center">
            <div className="flex justify-center mb-2">{item.icon}</div>
            <div className="text-[11px] font-medium text-[var(--text)]">{item.label}</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCreateTicket() {
  return (
    <div className="animate-in fade-in duration-200 h-full flex flex-col justify-center">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-1">
          Create a Ticket
        </h2>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Describe what you need. AI handles the rest.
        </p>
      </div>

      {/* Mini flow */}
      <div className="max-w-[380px] mx-auto space-y-0">
        {[
          { icon: <Pencil className="h-3.5 w-3.5 text-purple-400" />, bg: 'bg-purple-400/10', title: 'Describe your idea', sub: 'Plain language, rough notes, even a Slack message' },
          { icon: <Sparkles className="h-3.5 w-3.5 text-violet-400" />, bg: 'bg-violet-400/10', title: 'AI generates the spec', sub: 'Problem statement, acceptance criteria, file changes' },
          { icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />, bg: 'bg-emerald-400/10', title: 'Review & approve', sub: 'Quality score, developer review, PM sign-off' },
        ].map((item, i) => (
          <div key={item.title} className="flex gap-3 items-start">
            <div className="flex flex-col items-center">
              <div className={`h-7 w-7 rounded-md ${item.bg} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              {i < 2 && <div className="w-px flex-1 min-h-[20px] bg-[var(--border-subtle)] my-1" />}
            </div>
            <div className="pb-3 pt-0.5">
              <p className="text-[13px] font-medium text-[var(--text)]">{item.title}</p>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket types */}
      <div className="max-w-[380px] mx-auto mt-4 pt-4 border-t border-[var(--border-subtle)]">
        <p className="text-[11px] text-[var(--text-tertiary)] mb-2">Supports all ticket types:</p>
        <div className="flex items-center gap-2">
          {[
            { label: 'Feature', color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Bug', color: 'bg-red-500/10 text-red-400' },
            { label: 'Task', color: 'bg-amber-500/10 text-amber-400' },
          ].map((t) => (
            <span key={t.label} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${t.color}`}>{t.label}</span>
          ))}
          <span className="text-[10px] text-[var(--text-tertiary)]">+ import from Jira, Linear</span>
        </div>
      </div>
    </div>
  );
}

function StepRefinement() {
  return (
    <div className="animate-in fade-in duration-200 h-full flex flex-col justify-center">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-1">
          AI Refinement
        </h2>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Smart questions turn a rough idea into a complete spec.
        </p>
      </div>

      {/* Mock Q&A conversation */}
      <div className="max-w-[420px] mx-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">AI Refinement — Round 1 of 2</span>
          <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">3 questions</span>
        </div>

        {/* Questions */}
        <div className="p-4 space-y-3">
          {[
            { q: 'Should the dark mode persist across sessions?', a: 'Yes, save to localStorage' },
            { q: 'Which components need theme support?', a: 'Header, sidebar, and all cards' },
            { q: 'Should there be a system preference option?', a: 'Yes, default to system' },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                <p className="text-[12px] text-[var(--text-secondary)]">{item.q}</p>
              </div>
              <div className="ml-5 px-2.5 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[11px] text-emerald-400/80">{item.a}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Score */}
        <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-tertiary)]">Quality improved</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-tertiary)]">62</span>
            <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[11px] font-medium text-emerald-400">94</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-4 max-w-[360px] mx-auto">
        Each round focuses on missing details. You answer in plain language — AI updates the spec automatically.
      </p>
    </div>
  );
}

function StepDevelop() {
  return (
    <div className="animate-in fade-in duration-200 h-full flex flex-col justify-center">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-1">
          Two Ways to Develop
        </h2>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Choose the path that fits your role.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-[460px] mx-auto">
        {/* Cloud Develop */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="text-[13px] font-medium text-[var(--text)]">Cloud Develop</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium mb-3">
            For PMs & teams
          </span>
          <div className="space-y-2 text-[11px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
              One-click from the browser
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
              Auto PR with change record
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
              Live preview in browser
            </div>
          </div>
        </div>

        {/* Developer CLI */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] p-4 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-[13px] font-medium text-[var(--text)]">Developer CLI</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium mb-3">
            For developers
          </span>
          <div className="space-y-2 text-[11px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-500/50" />
              Pick up tickets from terminal
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-500/50" />
              Claude Code + MCP bridge
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-500/50" />
              Full local dev environment
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-5 max-w-[380px] mx-auto">
        Both paths produce the same result: tested code, documented decisions, and a pull request ready for review.
      </p>
    </div>
  );
}

function StepTrackPreview() {
  return (
    <div className="animate-in fade-in duration-200 h-full flex flex-col justify-center">
      <div className="text-center mb-6">
        <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-1">
          Track & Preview
        </h2>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Every decision documented. Every change visible.
        </p>
      </div>

      <div className="max-w-[440px] mx-auto space-y-4">
        {/* Change Record mock */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-violet-400" />
            <span className="text-[13px] font-medium text-[var(--text)]">Change Records</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: '💡', text: 'Used Context API instead of Redux — lighter for this scope' },
              { icon: '⚠️', text: 'Skipped test for CSS-only theme toggle — no logic to test' },
            ].map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="shrink-0">{event.icon}</span>
                <span className="text-[var(--text-tertiary)] leading-relaxed">{event.text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><GitPullRequest className="w-3 h-3" /> PR #5</span>
            <span className="flex items-center gap-1"><FileCode className="w-3 h-3" /> 4 files</span>
            <span className="flex items-center gap-1 text-emerald-400/70">+87 -12</span>
          </div>
        </div>

        {/* Preview mock */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
            <span className="text-[13px] font-medium text-[var(--text)]">Live Preview</span>
          </div>
          <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            Run the generated code directly in your browser — no local setup.
            See the result before the PR is merged.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <Eye className="w-3 h-3" />
              WebContainer preview
            </span>
            <span className="text-[var(--text-tertiary)]">&middot;</span>
            <span className="text-[var(--text-tertiary)]">Opens in a new tab</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepConnect({ onBeforeConnect }: { onBeforeConnect: () => void }) {
  return (
    <div className="animate-in fade-in duration-200 h-full flex flex-col justify-center">
      <div className="text-center mb-4">
        <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-1">
          Connect Your Repository
        </h2>
        <p className="text-[13px] text-[var(--text-tertiary)] max-w-[380px] mx-auto leading-relaxed">
          Forge reads your codebase for deeper, more accurate specs. Read-only — your code stays on GitHub.
        </p>
      </div>
      <div className="max-w-[380px] mx-auto w-full">
        <GitHubIntegration onBeforeConnect={onBeforeConnect} />
        <PrivacyNote />
        <p className="text-[10px] text-center text-[var(--text-tertiary)] mt-3">
          You can also connect Jira, Linear, and Figma anytime from Settings.
        </p>
      </div>
    </div>
  );
}
