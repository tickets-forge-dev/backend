/**
 * Configuration validation types
 */

export type ConfigStatus = 'valid' | 'warning' | 'error' | 'missing';

export type FirebaseConfigSource = 'backend' | 'env' | 'missing';
export type ApiUrlStatus = 'set' | 'using-default' | 'unreachable';
export type PostHogKeyStatus = 'valid' | 'invalid-format' | 'missing';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  status: {
    firebaseConfig: FirebaseConfigSource;
    apiUrl: ApiUrlStatus;
    posthogKey: PostHogKeyStatus;
    backendReachable: boolean;
  };
}

export interface ValidationCheck {
  name: string;
  status: ConfigStatus;
  message: string;
  resolution?: string;
}
