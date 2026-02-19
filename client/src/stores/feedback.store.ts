import { create } from 'zustand';

interface FeedbackStore {
  feedbackOpen: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  feedbackOpen: false,

  openFeedback: () => {
    set({ feedbackOpen: true });
  },

  closeFeedback: () => {
    set({ feedbackOpen: false });
  },
}));
