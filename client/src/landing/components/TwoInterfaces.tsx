import { CopyCommand } from '@/core/components/CopyCommand';
import { TerminalAnimation } from './TerminalAnimation';
import { TicketListAnimation } from './TicketListAnimation';

export function TwoInterfaces() {
  return (
    <section className="py-24 border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Two interfaces, one platform</h2>
          <p className="text-[var(--text-secondary)]">Define and manage in the browser. Develop in the terminal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left — Web App for PMs */}
          <div className="flex flex-col gap-4">
            <TicketListAnimation />
            <div className="px-1">
              <h3 className="font-semibold text-lg mb-2">Web App</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Create tickets, review AI-enriched specs, and approve — all from the browser. Drag-and-drop to organize, track quality scores at a glance.
              </p>
            </div>
          </div>

          {/* Right — CLI for Devs */}
          <div className="flex flex-col gap-4">
            <TerminalAnimation />
            <div className="px-1">
              <h3 className="font-semibold text-lg mb-2">Developer Tools &mdash; CLI / MCP</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                Type <code className="text-[var(--text)] bg-[var(--bg-subtle)] px-1 py-0.5 rounded text-xs">/forge:develop</code> in Claude Code — the MCP server enriches the spec with your real codebase and kicks off implementation automatically.
              </p>
              <CopyCommand command="npm install -g @anthropic-forge/cli" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
