import Image from 'next/image';
import { CopyCommand } from '@/core/components/CopyCommand';

export function TwoInterfaces() {
  return (
    <section className="py-24 border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Two interfaces, one platform</h2>
          <p className="text-[var(--text-secondary)]">PMs work in the browser. Developers work in the terminal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left overflow-hidden">
            <Image
              src="/images/ticket-screenshot.png"
              alt="Forge web app showing the ticket list with statuses, priorities, and quality scores"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
            <div className="px-5 py-5 border-t border-[var(--border-subtle)]">
              <h3 className="font-semibold text-lg mb-2">Web App</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Create tickets, organize them into folders, review answers, and approve — all from the browser. Drag-and-drop tickets between folders to keep your feed clean.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left overflow-hidden">
            <Image
              src="/images/cli-screenshot.png"
              alt="Claude Code terminal with Forge MCP integration listing tickets and running review"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
            <div className="px-5 py-5 border-t border-[var(--border-subtle)]">
              <h3 className="font-semibold text-lg mb-2">CLI</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                Run <code className="text-[var(--text)] bg-[var(--bg-subtle)] px-1 py-0.5 rounded text-xs">forge login</code> to authenticate, then <code className="text-[var(--text)] bg-[var(--bg-subtle)] px-1 py-0.5 rounded text-xs">forge mcp install</code> to connect your AI assistant. Once connected, run <code className="text-cyan-400">forge develop</code> for guided implementation prep — Forgy asks the right questions and creates your branch automatically.
              </p>
              <CopyCommand command="npm install -g @anthropic-forge/cli" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
