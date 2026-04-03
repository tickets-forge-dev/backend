'use client';

import { useReducer, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DemoBrowserChrome } from './DemoBrowserChrome';
import { DemoSidebar } from './DemoSidebar';
import { DemoTicketList } from './DemoTicketList';
import { DemoTicketDetail } from './DemoTicketDetail';
import { DemoDevelopSession } from './DemoDevelopSession';
import { DemoDelivered } from './DemoDelivered';
import { DemoPreview } from './DemoPreview';
import { DemoDecisionLogs } from './DemoDecisionLogs';
import { DemoDecisionLogDetail } from './DemoDecisionLogDetail';
import { demoReducer, initialDemoState, getSlideDirection } from './demo-state';

export function InteractiveDemo() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const direction = getSlideDirection(state.previousScreen, state.screen);

  const slideVariants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  // Determine main content screen (excludes develop-session which overlays)
  const mainScreen = state.screen === 'develop-session' ? 'ticket-detail' : state.screen;

  const renderScreen = useCallback(() => {
    switch (mainScreen) {
      case 'ticket-list':
        return (
          <DemoTicketList
            onOpenTicket={() => dispatch({ type: 'OPEN_TICKET' })}
            hasInteracted={state.hasInteracted}
          />
        );
      case 'ticket-detail':
        return (
          <DemoTicketDetail
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onStartDevelop={() => dispatch({ type: 'START_DEVELOP' })}
            hasInteracted={true}
            developComplete={state.developComplete}
          />
        );
      case 'delivered':
        return (
          <DemoDelivered
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onViewPreview={() => dispatch({ type: 'VIEW_PREVIEW' })}
          />
        );
      case 'preview':
        return (
          <DemoPreview onBack={() => dispatch({ type: 'GO_BACK' })} />
        );
      case 'decision-logs':
        return (
          <DemoDecisionLogs
            onOpenRecord={(index) => dispatch({ type: 'OPEN_DECISION_LOG', recordIndex: index })}
          />
        );
      case 'decision-log-detail':
        return (
          <DemoDecisionLogDetail
            recordIndex={state.selectedRecordIndex}
            onBack={() => dispatch({ type: 'GO_BACK' })}
          />
        );
      default:
        return null;
    }
  }, [mainScreen, state.hasInteracted, state.developComplete, state.selectedRecordIndex]);

  return (
    <DemoBrowserChrome screen={state.screen}>
      <div className="flex h-full">
        {/* Sidebar */}
        <DemoSidebar
          screen={state.screen}
          onOpenTickets={() => dispatch({ type: 'OPEN_TICKETS' })}
          onOpenDecisionLogs={() => dispatch({ type: 'OPEN_DECISION_LOGS' })}
        />

        {/* Main content area */}
        <div className="flex-1 relative overflow-hidden bg-[var(--bg-subtle)]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={mainScreen}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>

          {/* Develop session blade overlay */}
          <AnimatePresence>
            {state.screen === 'develop-session' && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-y-0 right-0 z-20"
              >
                <DemoDevelopSession
                  onComplete={() => dispatch({ type: 'DEVELOP_COMPLETE' })}
                  onViewPreview={() => dispatch({ type: 'VIEW_PREVIEW' })}
                  onClose={() => dispatch({ type: 'GO_BACK' })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DemoBrowserChrome>
  );
}
