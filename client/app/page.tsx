'use client';

import { MotionConfig } from 'framer-motion';
import { LandingHeader } from '@/landing/components/LandingHeader';
import { HeroSection } from '@/landing/components/HeroSection';
import { HowItWorks } from '@/landing/components/HowItWorks';
import { ProductShowcaseWeb } from '@/landing/components/ProductShowcaseWeb';
import { ProductShowcaseCLI } from '@/landing/components/ProductShowcaseCLI';
import { BeforeAfter } from '@/landing/components/BeforeAfter';
import { CTASection } from '@/landing/components/CTASection';
import { BackgroundMesh } from '@/landing/components/BackgroundMesh';
import { LandingFooter } from '@/landing/components/LandingFooter';

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        data-theme="dark"
        className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]"
      >
        <BackgroundMesh />
        <LandingHeader />
        <main className="relative z-10 flex-1">
          <HeroSection />
          <HowItWorks />
          <ProductShowcaseWeb />
          <ProductShowcaseCLI />
          <BeforeAfter />
          <CTASection />
        </main>
        <footer className="relative z-10">
          <LandingFooter />
        </footer>
      </div>
    </MotionConfig>
  );
}
