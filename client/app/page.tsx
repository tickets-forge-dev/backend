import { LandingHeader } from '@/landing/components/LandingHeader';
import { HeroSection } from '@/landing/components/HeroSection';
import { AECShowcase } from '@/landing/components/AECShowcase';
import { TwoInterfaces } from '@/landing/components/TwoInterfaces';
import { HowItWorks } from '@/landing/components/HowItWorks';
import { WhyForge } from '@/landing/components/WhyForge';
import { CTASection } from '@/landing/components/CTASection';
import { EmberSprinkles } from '@/landing/components/EmberSprinkles';
import { LandingFooter } from '@/landing/components/LandingFooter';

export default function LandingPage() {
  return (
    <div data-theme="dark" className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <AECShowcase />
        <TwoInterfaces />
        <HowItWorks />
        <WhyForge />
        <CTASection />
      </main>
      <EmberSprinkles />
      <LandingFooter />
    </div>
  );
}
