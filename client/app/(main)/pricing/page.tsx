'use client';

import { Button } from '@/core/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface TierFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: number;
  period: string;
  description: string;
  features: TierFeature[];
  cta: string;
  ctaLink: string;
  highlighted?: boolean;
  comingSoon?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Try Forge with your team — no credit card required',
    features: [
      { name: 'Unlimited tickets', included: true },
      { name: 'Web UI for PMs', included: true },
      { name: 'CLI for developers', included: true },
      { name: 'MCP integration (Cursor, Claude, Windsurf)', included: true },
      { name: 'Basic AI enrichment', included: true },
      { name: 'GitHub integration', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Try for Free',
    ctaLink: '/tickets',
  },
  {
    name: 'Pro',
    price: 12,
    period: 'PM/month',
    description: 'One PM seat, unlimited developers via CLI',
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Deep code analysis', included: true },
      { name: 'GitHub repo integration', included: true },
      { name: 'Agent-ready XML exports', included: true },
      { name: 'Unlimited dev CLI access', included: true },
      { name: 'Priority email support', included: true },
    ],
    cta: 'Coming Soon',
    ctaLink: '/tickets',
    highlighted: true,
    comingSoon: true,
  },
  {
    name: 'Team',
    price: 39,
    period: 'PM/month',
    description: 'Multiple PMs + full team features',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Multiple PM seats', included: true },
      { name: 'Team workspaces', included: true },
      { name: 'PM approval workflows', included: true },
      { name: 'Advanced analytics', included: true },
      { name: '24/7 priority support', included: true },
    ],
    cta: 'Coming Soon',
    ctaLink: '/tickets',
    comingSoon: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)]/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            Simple Pricing
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Pay for PMs, not developers. One PM seat can create tickets for unlimited devs via CLI.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              🎉 Free during beta — try everything, no limits!
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border transition-all flex flex-col relative ${
                tier.comingSoon
                  ? 'opacity-60 pointer-events-none select-none'
                  : ''
              } ${
                tier.highlighted
                  ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/5 via-[var(--bg)] to-[var(--bg)] ring-2 ring-[var(--primary)]/30 shadow-md scale-100'
                  : 'border-[var(--border)]/20 hover:border-[var(--border)]/40'
              } overflow-hidden`}
            >
              {tier.comingSoon && (
                <div className="absolute inset-0 z-10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                  <div className="bg-[var(--bg)] border-2 border-[var(--primary)] rounded-lg px-4 py-2 shadow-lg">
                    <span className="text-sm font-bold text-[var(--primary)]">
                      Coming Soon
                    </span>
                  </div>
                </div>
              )}
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
                {tier.price === 0 && (
                  <p className="text-xs text-green-500 font-medium">
                    Free forever
                  </p>
                )}
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
                <Link href={tier.ctaLink}>
                  <Button
                    className="w-full h-9 text-sm"
                    variant={tier.highlighted ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </Link>
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
                q: 'What is the CLI for?',
                a: 'The CLI connects to AI coding assistants (Cursor, Claude Code, Windsurf) via MCP protocol, giving them full ticket context.',
              },
              {
                q: 'Do developers need a paid seat?',
                a: 'No! Developers use the free CLI. Only PMs who create and manage tickets need a paid seat.',
              },
              {
                q: 'What if I\'m not a technical PM?',
                a: 'No problem! Describe what you want in plain language. AI enriches tickets with technical details automatically.',
              },
              {
                q: 'Can I connect my GitHub repo?',
                a: 'Yes! Connect GitHub for deeper code analysis. Or keep code local — devs can enrich via CLI instead.',
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
            Ready to ship faster?
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Join teams using Forge as their AI-native project management platform.
          </p>
          <Link href="/tickets">
            <Button size="sm" className="h-9">Try for Free</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
