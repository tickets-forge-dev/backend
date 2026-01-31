import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      {/* Header with readiness badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
            Add user authentication
          </h1>
          <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
            Ticket #{id}
          </p>
        </div>
        <Badge className="bg-[var(--green)] text-white">
          Ready 85
        </Badge>
      </div>

      {/* Full-width sections with inline editing areas */}
      <section className="space-y-3">
        <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
          Acceptance Criteria
        </h2>
        <Card className="p-4">
          <ol className="space-y-2 text-[var(--text-base)] text-[var(--text-secondary)]">
            <li>1. Users can sign up with email/password</li>
            <li>2. Users can log in with email/password</li>
            <li>3. Session persists across browser refresh</li>
          </ol>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
          Assumptions
        </h2>
        <Card className="p-4">
          <ul className="space-y-2 text-[var(--text-base)] text-[var(--text-secondary)]">
            <li>• Using Firebase Auth for authentication</li>
            <li>• Email verification not required for MVP</li>
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
          Affected Code
        </h2>
        <Card className="p-4">
          <ul className="space-y-1 text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
            <li>client/src/services/auth.service.ts</li>
            <li>client/src/stores/auth.store.ts</li>
            <li>client/app/(auth)/login/page.tsx</li>
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-[var(--text-md)] font-medium text-[var(--text)]">
          Estimate
        </h2>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-[var(--text-base)] text-[var(--text)]">
              4-8 hours <span className="text-[var(--text-tertiary)]">(Medium confidence)</span>
            </p>
            <ul className="space-y-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
              <li>• 3 modules touched</li>
              <li>• Auth logic change</li>
              <li>• Firebase SDK integration</li>
            </ul>
          </div>
        </Card>
      </section>

      {/* Footer with export button */}
      <div className="flex justify-end pt-4">
        <Button>
          Export to Jira
        </Button>
      </div>
    </div>
  );
}
