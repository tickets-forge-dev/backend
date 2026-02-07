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
      <div className="border-b border-[var(--border)]/30">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
            Choose the plan that works best for your team. Upgrade anytime.
          </p>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border transition-all ${
                tier.highlighted
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20 shadow-lg scale-105 md:scale-100'
                  : 'border-[var(--border)]/30 bg-[var(--bg-subtle)]'
              } p-8 flex flex-col`}
            >
              {tier.highlighted && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
              )}

              {/* Tier Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[var(--text)] mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">
                  {tier.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--text)]">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-[var(--text-secondary)]">
                      /{tier.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Tickets Info */}
              <div className="mb-8 pb-8 border-b border-[var(--border)]/20">
                <p className="text-sm text-[var(--text-secondary)]">
                  {tier.ticketsPerMonth === -1
                    ? 'Unlimited tickets/month'
                    : `${tier.ticketsPerMonth} tickets/month`}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
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
                variant={tier.highlighted ? 'default' : 'outline'}
                size="lg"
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t border-[var(--border)]/30 bg-[var(--bg-subtle)]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'Do you offer annual billing discounts?',
                a: 'Contact us for enterprise pricing and annual billing options.',
              },
              {
                q: 'What happens if I exceed my monthly tickets?',
                a: 'We\'ll notify you when you\'re approaching your limit. You can upgrade anytime to increase capacity.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! The Free tier includes 3 tickets/month with full feature access. No credit card required.',
              },
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-[var(--text)] mb-2">
                  {item.q}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-[var(--border)]/30">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4">
            Ready to get started?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Join hundreds of teams using Forge to generate better technical specifications.
          </p>
          <Button size="lg">Start Free</Button>
        </div>
      </div>
    </div>
  );
}
