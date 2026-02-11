export const metadata = {
  title: 'Common Objections | Documentation',
  description: 'Addressing common questions about Forge vs using Claude directly.',
};

export default function CommonObjectionsPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Common Objections</h1>
        <p className="text-[var(--text-secondary)]">Why choose Forge over using Claude directly?</p>
      </div>

      <div className="space-y-8">
        {/* Objection 1: Just Use Claude */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            &quot;Can&apos;t I just ask Claude to write specs directly?&quot;
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-blue-900 dark:text-blue-100">The Reality:</p>
            <p className="text-[var(--text-secondary)]">
              You <em>can</em> ask Claude. But here&apos;s the problem:
            </p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>• <strong>You&apos;re spending 2+ hours</strong> copying code, repo structure, package files, trying to get the context right</li>
              <li>• <strong>Your specs are generic</strong> — they don&apos;t follow your team&apos;s conventions, layer structure, or testing practices</li>
              <li>• <strong>No iteration loop</strong> — you can&apos;t easily regenerate based on feedback</li>
              <li>• <strong>PMs aren&apos;t prompt engineers</strong> — your time should be on requirements, not learning how to ask Claude better questions</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <strong>Analogy:</strong> Yes, you could write a JIRA issue by hand. You could also use Jira. Forge is the &quot;Jira of spec generation.&quot;
            </p>
          </div>
        </section>

        {/* Objection 2: Claude is Cheaper */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            &quot;But Claude is free/cheap. Why pay for Forge?&quot;
          </h2>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-amber-900 dark:text-amber-100">The Math:</p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>• <strong>Your time:</strong> 2-4 hours per spec × $100+/hour (PM salary) = $200-400 per spec</li>
              <li>• <strong>Engineer time answering questions:</strong> 1+ hours × $150+/hour = $150+</li>
              <li>• <strong>Total cost of a manually-written spec:</strong> $350-550</li>
              <li>• <strong>Forge cost:</strong> A fraction of that</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
              Claude API tokens cost ~$0.003 per spec. Your time costs 100-200x more.
            </p>
          </div>
        </section>

        {/* Objection 3: Just a Claude Wrapper */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            &quot;Isn&apos;t Forge just a Claude wrapper? Can&apos;t I build my own?&quot;
          </h2>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-purple-900 dark:text-purple-100">Fair Point. But Consider:</p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>• <strong>Yes, Forge uses Claude.</strong> But it automates the entire workflow (context gathering, question generation, iteration, feedback loops)</li>
              <li>• <strong>Building your own = 3-6 months engineering time.</strong> That engineer could be shipping features instead</li>
              <li>• <strong>You&apos;d need to maintain it.</strong> Prompt engineering changes as models improve. Forge stays current</li>
              <li>• <strong>Your homegrown version won&apos;t integrate with Linear/Jira</strong> or handle edge cases Forge already solves</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              Building a &quot;simple wrapper&quot; costs $50-200k in engineering time. That&apos;s a lot of Forge subscriptions.
            </p>
          </div>
        </section>

        {/* Objection 4: Engineers Should Use Claude */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            &quot;Why not just have engineers use Claude to analyze code and write specs?&quot;
          </h2>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-rose-900 dark:text-rose-100">Here&apos;s the Problem:</p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>• <strong>Engineers spend time writing specs instead of coding.</strong> That&apos;s not what you pay them for</li>
              <li>• <strong>Your best engineers are busiest.</strong> You can&apos;t ask them to write specs — they have features to ship</li>
              <li>• <strong>Specs need PM thinking, not engineer thinking.</strong> Engineers optimize for implementation. PMs optimize for value and clarity</li>
              <li>• <strong>Specs need business context.</strong> &quot;Why are we building this?&quot; — engineers shouldn&apos;t have to figure that out</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-rose-200 dark:border-rose-800">
              Forge frees engineers to code. It enables PMs to spec effectively without being technical.
            </p>
          </div>
        </section>

        {/* Objection 5: But Why Do I Need It */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            &quot;If Claude is so powerful, why do I need Forge at all?&quot;
          </h2>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-green-900 dark:text-green-100">Because Claude Alone Isn&apos;t Enough:</p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>• <strong>Claude doesn&apos;t know your repo.</strong> It needs context gathering, file selection, smart sampling of your codebase</li>
              <li>• <strong>Claude doesn&apos;t know your conventions.</strong> Your team might structure APIs differently, test differently, deploy differently. Specs need to match that</li>
              <li>• <strong>Claude can&apos;t iterate with your team.</strong> Once the spec is written, questions come back. Regenerating manually is painful</li>
              <li>• <strong>Claude doesn&apos;t integrate with your tools.</strong> You have to copy/paste specs into Linear/Jira/Notion. Forge syncs directly</li>
              <li>• <strong>Claude wasn&apos;t built for product workflows.</strong> It&apos;s a general AI. Forge is built specifically for writing implementation specs</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-green-200 dark:border-green-800">
              Forge + Claude is powerful. Claude alone is like having a calculator but no spreadsheet.
            </p>
          </div>
        </section>

        {/* Objection 6: Our Team is Good */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            &quot;Our team writes great specs already. Do we really need this?&quot;
          </h2>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-indigo-900 dark:text-indigo-100">That&apos;s Great! But Consider:</p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>• <strong>Speed.</strong> Even great teams take 2-4 hours per spec. Forge does it in minutes</li>
              <li>• <strong>Consistency.</strong> Your best writer left last month. Specs quality now varies. Forge keeps it consistent</li>
              <li>• <strong>Scale.</strong> You&apos;re shipping 50 tickets next quarter. Can you scale your process from 10 to 50?</li>
              <li>• <strong>You&apos;re still not reading code.</strong> Specs without actual code analysis are incomplete. Forge does that automatically</li>
              <li>• <strong>That&apos;s 200+ hours saved</strong> your team could spend on strategy, user research, or shipping</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
              Great specs + Forge = even better specs, written faster, at scale.
            </p>
          </div>
        </section>

        {/* The Real Point */}
        <section className="space-y-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold">The Bottom Line</h2>
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-[var(--text-secondary)]">
              <strong>Forge isn&apos;t about having Claude. It&apos;s about having a workflow.</strong>
            </p>
            <p className="text-[var(--text-secondary)]">
              You could theoretically do everything Forge does manually:
            </p>
            <ul className="space-y-2 text-[var(--text-secondary)] ml-4">
              <li>✗ Copy your package.json and tsconfig to Claude</li>
              <li>✗ Manually select 15-20 files from your repo</li>
              <li>✗ Paste everything into Claude</li>
              <li>✗ Generate a spec</li>
              <li>✗ Wait for team feedback</li>
              <li>✗ Edit the spec manually</li>
              <li>✗ Ask Claude to regenerate the affected sections</li>
              <li>✗ Paste the spec into Linear</li>
              <li>✗ Copy acceptance criteria to BDD format</li>
              <li>✗ Iterate again when the engineer asks questions</li>
            </ul>
            <p className="text-[var(--text-secondary)] mt-4">
              <strong>Or you could use Forge and do it in 5 minutes.</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              That&apos;s the difference between having a powerful tool and having a workflow built on that tool.
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
