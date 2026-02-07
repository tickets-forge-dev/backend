'use client';

import { Button } from '@/core/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export interface TierFeature {
  name: string;
  included: boolean;
}

export interface TierCardProps {
  name: string;
  price: number;
  period?: string;
  description: string;
  ticketsPerMonth: number;
  features: TierFeature[];
  cta: string;
  highlighted?: boolean;
  onCta?: () => void;
}

export function TierCard({
  name,
  price,
  period = 'month',
  description,
  ticketsPerMonth,
  features,
  cta,
  highlighted = false,
  onCta,
}: TierCardProps) {
  return (
    <div
      className={`rounded-lg border transition-all ${
        highlighted
          ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20 shadow-lg scale-105 md:scale-100'
          : 'border-[var(--border)]/30 bg-[var(--bg-subtle)]'
      } p-8 flex flex-col`}
    >
      {highlighted && (
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider">
            Recommended
          </span>
        </div>
      )}

      {/* Tier Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[var(--text)] mb-2">{name}</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">{description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[var(--text)]">${price}</span>
          {price > 0 && (
            <span className="text-[var(--text-secondary)]">/{period}</span>
          )}
        </div>
      </div>

      {/* Tickets Info */}
      <div className="mb-8 pb-8 border-b border-[var(--border)]/20">
        <p className="text-sm text-[var(--text-secondary)]">
          {ticketsPerMonth === -1
            ? 'Unlimited tickets/month'
            : `${ticketsPerMonth} tickets/month`}
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <div key={feature.name} className="flex items-start gap-3">
            {feature.included ? (
              <CheckCircle2 className="h-5 w-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            ) : (
              <div className="h-5 w-5 rounded-full border border-[var(--border)]/30 flex-shrink-0 mt-0.5" />
            )}
            <span
              className={`text-sm ${
                feature.included
                  ? 'text-[var(--text-secondary)]'
                  : 'text-[var(--text-tertiary)]'
              }`}
            >
              {feature.name}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Button
        className="w-full"
        variant={highlighted ? 'default' : 'outline'}
        size="lg"
        onClick={onCta}
      >
        {cta}
      </Button>
    </div>
  );
}
