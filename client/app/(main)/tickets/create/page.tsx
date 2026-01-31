import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';

export default function CreateTicketPage() {
  return (
    <div className="mx-auto max-w-[var(--content-narrow)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[var(--text-xl)] font-medium text-[var(--text)]">
          Create Ticket
        </h1>
        <p className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          Provide minimal intent to generate an executable ticket
        </p>
      </div>

      {/* Minimal centered form */}
      <Card className="p-6">
        <form className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-[var(--text-sm)] font-medium text-[var(--text)] mb-2"
            >
              Title
            </label>
            <Input
              id="title"
              placeholder="Add user authentication"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-[var(--text-sm)] font-medium text-[var(--text)] mb-2"
            >
              Description <span className="text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <Textarea
              id="description"
              placeholder="Add context to help generate a better ticket..."
              rows={6}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost">
              Cancel
            </Button>
            <Button type="submit">
              Generate Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
