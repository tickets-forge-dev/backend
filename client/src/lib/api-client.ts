import axios, { AxiosInstance } from 'axios';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';

/**
 * Shared token refresh promise to prevent concurrent 401s from each
 * independently calling getIdToken(true) (token refresh storm).
 */
let refreshPromise: Promise<string> | null = null;

async function getRefreshedToken(): Promise<string> {
  if (!auth.currentUser) throw new Error('No user');
  if (refreshPromise) return refreshPromise;
  const promise = auth.currentUser.getIdToken(true).finally(() => {
    refreshPromise = null;
  });
  refreshPromise = promise;
  return promise;
}

/**
 * Creates an Axios instance with Firebase auth token handling.
 *
 * - Request interceptor: attaches Bearer token from Firebase currentUser
 * - Response interceptor: on 401, force-refreshes the token and retries once
 *
 * This prevents expired-token loops when the cached ID token becomes stale
 * (e.g. after network reconnection or long idle periods).
 */
export function createApiClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000,
  });

  // Attach Firebase ID token and team context to every request
  client.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach current team ID so the backend resolves the correct workspace
    const teamId = useTeamStore.getState().currentTeam?.id;
    if (teamId && !config.headers['x-team-id']) {
      config.headers['x-team-id'] = teamId;
    }

    return config;
  });

  // On 401, force-refresh the token and retry the request once
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retried &&
        auth.currentUser
      ) {
        originalRequest._retried = true;
        try {
          const freshToken = await getRefreshedToken();
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return client(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}
