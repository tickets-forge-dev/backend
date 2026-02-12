'use client';

import { Button } from '@/core/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface TierFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: number;
  period: string;
  description: string;
  ticketsPerMonth: number;
  features: TierFeature[];
  cta: string;
  highlighted?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Get started with basic ticket generation',
    ticketsPerMonth: 3,
    features: [
      { name: '3 tickets/month', included: true },
      { name: 'Basic features', included: true },
      { name: 'Community support', included: true },
      { name: 'Export integrations', included: false },
      { name: 'Team workspace', included: false },
      { name: 'Role-based access', included: false },
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: 12,
    period: 'month',
    description: 'For individuals and small teams scaling ticket generation',
    ticketsPerMonth: 30,
    features: [
      { name: '30 tickets/month', included: true },
      { name: 'Export to Linear & Jira', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Up to 3 team members', included: true },
      { name: 'Role-based access', included: false },
    ],
    cta: 'Subscribe',
    highlighted: true,
  },
  {
    name: 'Team',
    price: 59,
    period: 'month',
    description: 'For organizations with advanced needs',
    ticketsPerMonth: -1, // unlimited
    features: [
      { name: 'Unlimited tickets', included: true },
      { name: 'Export to Linear, Jira & GitHub', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Advanced analytics & reporting', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Role-based access & permissions', included: true },
    ],
    cta: 'Subscribe',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)]/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            Transparent Pricing
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose the plan that works for you. Upgrade anytime.
          </p>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border transition-all flex flex-col ${
                tier.highlighted
                  ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/5 via-[var(--bg)] to-[var(--bg)] ring-2 ring-[var(--primary)]/30 shadow-md scale-100'
                  : 'border-[var(--border)]/20 hover:border-[var(--border)]/40'
              } overflow-hidden`}
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                {tier.highlighted && (
                  <div className="mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-semibold">
                      RECOMMENDED
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-[var(--text)] mb-1">
                  {tier.name}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                  {tier.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="px-6 py-3 border-t border-[var(--border)]/10">
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-3xl font-bold text-[var(--text)]">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      /{tier.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {tier.ticketsPerMonth === -1
                    ? 'Unlimited tickets/month'
                    : `${tier.ticketsPerMonth} tickets/month`}
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-4 flex-1">
                <div className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-[var(--border)]/30 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs leading-tight ${
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
              </div>

              {/* CTA Button */}
              <div className="px-6 py-4 border-t border-[var(--border)]/10">
                <Button
                  className="w-full h-9 text-sm"
                  variant={tier.highlighted ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t border-[var(--border)]/20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-xl font-bold text-[var(--text)] mb-6">
            FAQ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, upgrade or downgrade anytime. Changes take effect immediately.',
              },
              {
                q: 'Do you offer annual discounts?',
                a: 'Contact us for enterprise pricing and annual billing options.',
              },
              {
                q: 'What if I exceed my limit?',
                a: 'We\'ll notify you and you can upgrade anytime to increase capacity.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! Free tier includes 3 tickets/month with full access. No card required.',
              },
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="font-medium text-[var(--text)] text-sm mb-1">
                  {item.q}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-[var(--border)]/20 bg-gradient-to-b from-transparent to-[var(--bg-subtle)]">
        <div className="max-w-2xl mx-auto px-6 py-10 text-center">
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">
            Ready to get started?
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Join teams using Forge to generate better technical specifications.
          </p>
          <Button size="sm" className="h-9">Start Free</Button>
        </div>
      </div>
    </div>
  );
}
