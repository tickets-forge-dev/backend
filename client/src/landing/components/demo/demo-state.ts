export type DemoScreen =
  | 'ticket-list'
  | 'ticket-detail'
  | 'develop-session'
  | 'delivered'
  | 'preview'
  | 'decision-logs'
  | 'decision-log-detail';

export type DemoAction =
  | { type: 'OPEN_TICKET' }
  | { type: 'GO_BACK' }
  | { type: 'START_DEVELOP' }
  | { type: 'DEVELOP_COMPLETE' }
  | { type: 'VIEW_PREVIEW' }
  | { type: 'OPEN_DECISION_LOGS' }
  | { type: 'OPEN_DECISION_LOG'; recordIndex: number }
  | { type: 'OPEN_TICKETS' }
  | { type: 'RESET' };

export interface DemoState {
  screen: DemoScreen;
  previousScreen: DemoScreen | null;
  selectedRecordIndex: number;
  hasInteracted: boolean;
  developComplete: boolean;
}

export const initialDemoState: DemoState = {
  screen: 'ticket-list',
  previousScreen: null,
  selectedRecordIndex: 0,
  hasInteracted: false,
  developComplete: false,
};

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'OPEN_TICKET':
      return { ...state, screen: 'ticket-detail', previousScreen: state.screen, hasInteracted: true };
    case 'GO_BACK': {
      const backMap: Record<DemoScreen, DemoScreen> = {
        'ticket-detail': 'ticket-list',
        'develop-session': 'ticket-detail',
        'delivered': 'ticket-detail',
        'preview': 'delivered',
        'decision-log-detail': 'decision-logs',
        'decision-logs': 'ticket-list',
        'ticket-list': 'ticket-list',
      };
      return { ...state, screen: backMap[state.screen], previousScreen: state.screen };
    }
    case 'START_DEVELOP':
      return { ...state, screen: 'develop-session', previousScreen: 'ticket-detail' };
    case 'DEVELOP_COMPLETE':
      return { ...state, screen: 'delivered', previousScreen: 'develop-session', developComplete: true };
    case 'VIEW_PREVIEW':
      return { ...state, screen: 'preview', previousScreen: 'delivered' };
    case 'OPEN_DECISION_LOGS':
      return { ...state, screen: 'decision-logs', previousScreen: state.screen };
    case 'OPEN_DECISION_LOG':
      return { ...state, screen: 'decision-log-detail', previousScreen: 'decision-logs', selectedRecordIndex: action.recordIndex };
    case 'OPEN_TICKETS':
      return { ...state, screen: 'ticket-list', previousScreen: state.screen };
    case 'RESET':
      return initialDemoState;
    default:
      return state;
  }
}

export function getSlideDirection(from: DemoScreen | null, to: DemoScreen): 'left' | 'right' {
  const order: DemoScreen[] = ['ticket-list', 'decision-logs', 'decision-log-detail', 'ticket-detail', 'develop-session', 'delivered', 'preview'];
  const fromIdx = from ? order.indexOf(from) : -1;
  const toIdx = order.indexOf(to);
  return toIdx >= fromIdx ? 'left' : 'right';
}
