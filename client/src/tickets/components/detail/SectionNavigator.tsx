'use client';

import { useEffect, useState } from 'react';
import type { AECResponse } from '@/services/ticket.service';

interface Section {
  id: string;
  label: string;
  priority: 'primary' | 'secondary' | 'tertiary';
}

interface SectionNavigatorProps {
  ticket: AECResponse;
  techSpec?: any;
}

/**
 * Context-aware section navigator for bug vs feature tickets
 *
 * Shows different sections and priorities based on ticket type:
 * - Bugs: Reproduction Steps > AI Analysis > Implementation Details
 * - Features: Solution > Acceptance Criteria > Implementation Details
 */
export function SectionNavigator({ ticket, techSpec }: SectionNavigatorProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const isBugTicket = ticket.type === 'bug';

  // Define sections based on ticket type
  const getSections = (): Section[] => {
    if (isBugTicket) {
      const sections: Section[] = [
        { id: 'reproduction-steps', label: 'Reproduction Steps', priority: 'primary' },
        { id: 'acceptance-criteria', label: 'Acceptance Criteria', priority: 'secondary' },
      ];

      // AI Analysis sections (if available)
      if (techSpec?.bugDetails) {
        if (techSpec.bugDetails.relatedFiles?.length > 0) {
          sections.push({ id: 'related-files', label: 'Related Files', priority: 'primary' });
        }
        if (techSpec.bugDetails.suspectedCause) {
          sections.push({ id: 'suspected-cause', label: 'Suspected Cause', priority: 'primary' });
        }
        if (techSpec.bugDetails.suggestedFix) {
          sections.push({ id: 'suggested-fix', label: 'Suggested Fix', priority: 'primary' });
        }
      }

      // Implementation details
      if (techSpec?.solution) sections.push({ id: 'solution', label: 'Solution', priority: 'secondary' });
      if (techSpec?.fileChanges?.length > 0) sections.push({ id: 'file-changes', label: 'File Changes', priority: 'secondary' });
      if (techSpec?.apiChanges?.endpoints?.length > 0) sections.push({ id: 'api-endpoints', label: 'API Endpoints', priority: 'secondary' });
      if (techSpec?.testPlan) sections.push({ id: 'test-plan', label: 'Test Plan', priority: 'secondary' });
      if (ticket?.attachments && ticket.attachments.length > 0) sections.push({ id: 'assets', label: 'Assets', priority: 'tertiary' });

      return sections;
    } else {
      // Feature ticket sections
      const sections: Section[] = [
        { id: 'acceptance-criteria', label: 'Acceptance Criteria', priority: 'primary' },
      ];

      if (techSpec?.solution) sections.push({ id: 'solution', label: 'Solution', priority: 'primary' });
      if (techSpec?.fileChanges?.length > 0) sections.push({ id: 'file-changes', label: 'File Changes', priority: 'secondary' });
      if (techSpec?.apiChanges?.endpoints?.length > 0) sections.push({ id: 'api-endpoints', label: 'API Endpoints', priority: 'secondary' });
      if (techSpec?.layeredFileChanges) sections.push({ id: 'layered-changes', label: 'Backend / Frontend Changes', priority: 'secondary' });
      if (techSpec?.testPlan) sections.push({ id: 'test-plan', label: 'Test Plan', priority: 'secondary' });
      if (ticket?.attachments && ticket.attachments.length > 0) sections.push({ id: 'assets', label: 'Assets', priority: 'tertiary' });

      return sections;
    }
  };

  const sections = getSections();

  // Scroll spy: detect which section is in view
  useEffect(() => {
    const handleScroll = () => {
      let currentSection = '';
      const scrollPosition = window.scrollY + 200; // Offset for header

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = element.offsetTop;

          if (elementTop <= scrollPosition) {
            currentSection = section.id;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (sections.length === 0) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:block z-40">
      <nav className="space-y-2 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg backdrop-blur">
        {/* Bug/Feature indicator */}
        <div className="px-2 py-1 text-xs font-medium text-[var(--text-tertiary)] border-b border-[var(--border)]">
          {isBugTicket ? '🐛 Bug' : '✨ Feature'}
        </div>

        {/* Primary sections */}
        {sections.filter(s => s.priority === 'primary').length > 0 && (
          <div className="space-y-1">
            {sections
              .filter(s => s.priority === 'primary')
              .map(section => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`block text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? 'bg-[var(--primary)]/20 text-[var(--primary)] border-l-2 border-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {section.label}
                </button>
              ))}
          </div>
        )}

        {/* Secondary sections divider */}
        {sections.filter(s => s.priority === 'secondary').length > 0 && (
          <>
            <div className="border-t border-[var(--border)] my-2" />
            <div className="space-y-1">
              {sections
                .filter(s => s.priority === 'secondary')
                .map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`block text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-[var(--primary)]/20 text-[var(--primary)] border-l-2 border-[var(--primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
            </div>
          </>
        )}

        {/* Tertiary sections divider */}
        {sections.filter(s => s.priority === 'tertiary').length > 0 && (
          <>
            <div className="border-t border-[var(--border)] my-2" />
            <div className="space-y-1">
              {sections
                .filter(s => s.priority === 'tertiary')
                .map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`block text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-[var(--primary)]/20 text-[var(--primary)] border-l-2 border-[var(--primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
            </div>
          </>
        )}
      </nav>
    </div>
  );
}
