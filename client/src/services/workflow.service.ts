import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';

/**
 * WorkflowService - Handles ticket generation workflow execution
 * 
 * Responsibilities:
 * - Execute ticket generation workflow
 * - Resume from suspension points (findings, questions)
 * - Submit user answers
 * - Retry failed steps
 */

export interface ExecuteWorkflowRequest {
  aecId: string;
  workspaceId: string;
}

export interface ResumeFindingsRequest {
  aecId: string;
  action: 'proceed' | 'edit' | 'cancel';
}

export interface SubmitAnswersRequest {
  aecId: string;
  answers: Record<string, string>;
}

export interface RetryStepRequest {
  aecId: string;
  stepId: number;
}

export interface WorkflowResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class WorkflowService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout for long-running workflows
    });

    // Add Firebase ID token to all requests
    this.client.interceptors.request.use(async (config) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Start ticket generation workflow
   */
  async executeWorkflow(req: ExecuteWorkflowRequest): Promise<WorkflowResponse> {
    console.log('🚀 [WorkflowService] Executing workflow:', req.aecId);

    try {
      const response = await this.client.post<WorkflowResponse>('/workflows/execute', req);

      console.log('✅ [WorkflowService] Workflow started');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to start workflow';
      console.error('❌ [WorkflowService] Workflow execution failed:', message);

      throw new Error(message);
    }
  }

  /**
   * Resume workflow from findings review suspension
   */
  async resumeFromFindingsReview(req: ResumeFindingsRequest): Promise<WorkflowResponse> {
    console.log('⏸️ [WorkflowService] Resuming from findings review:', req.action);

    try {
      const response = await this.client.post<WorkflowResponse>('/workflows/resume-findings', req);

      console.log('✅ [WorkflowService] Resumed from findings review');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to resume workflow';
      console.error('❌ [WorkflowService] Resume failed:', message);

      throw new Error(message);
    }
  }

  /**
   * Submit answers to workflow questions
   */
  async submitQuestionAnswers(req: SubmitAnswersRequest): Promise<WorkflowResponse> {
    console.log('📝 [WorkflowService] Submitting question answers');

    try {
      const response = await this.client.post<WorkflowResponse>('/workflows/submit-answers', req);

      console.log('✅ [WorkflowService] Answers submitted');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to submit answers';
      console.error('❌ [WorkflowService] Submit answers failed:', message);

      throw new Error(message);
    }
  }

  /**
   * Skip questions
   */
  async skipQuestions(aecId: string): Promise<WorkflowResponse> {
    console.log('⏭️ [WorkflowService] Skipping questions');

    try {
      const response = await this.client.post<WorkflowResponse>('/workflows/skip-questions', { aecId });

      console.log('✅ [WorkflowService] Questions skipped');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to skip questions';
      console.error('❌ [WorkflowService] Skip questions failed:', message);

      throw new Error(message);
    }
  }

  /**
   * Retry a failed workflow step
   */
  async retryStep(req: RetryStepRequest): Promise<WorkflowResponse> {
    console.log('🔄 [WorkflowService] Retrying step:', req.stepId);

    try {
      const response = await this.client.post<WorkflowResponse>('/workflows/retry-step', req);

      console.log('✅ [WorkflowService] Step retry initiated');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to retry step';
      console.error('❌ [WorkflowService] Step retry failed:', message);

      throw new Error(message);
    }
  }
}

let workflowService: WorkflowService | null = null;

export function getWorkflowService(): WorkflowService {
  if (!workflowService) {
    workflowService = new WorkflowService();
  }
  return workflowService;
}
