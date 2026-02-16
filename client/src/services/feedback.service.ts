import axios, { AxiosInstance } from 'axios';

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

export interface SubmitFeedbackRequest {
  type: FeedbackType;
  message: string;
  url?: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
}

export class FeedbackService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
  }

  async submitFeedback(data: SubmitFeedbackRequest): Promise<SubmitFeedbackResponse> {
    try {
      const response = await this.client.post<SubmitFeedbackResponse>('/feedback', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }
}

// Singleton instance
let feedbackServiceInstance: FeedbackService | null = null;

export function getFeedbackService(): FeedbackService {
  if (!feedbackServiceInstance) {
    feedbackServiceInstance = new FeedbackService();
  }
  return feedbackServiceInstance;
}
