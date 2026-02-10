import type { AECResponse } from '@/services/ticket.service';

export const DEMO_TICKETS: AECResponse[] = [
  {
    id: 'demo-1',
    workspaceId: 'demo',
    status: 'complete',
    title: 'Add dark mode to dashboard',
    description: 'Enhance the dashboard with a dark mode toggle that respects system preferences and persists user choice.',
    type: 'feature',
    priority: 'medium',
    readinessScore: 92,
    generationState: {
      currentStep: 3,
      steps: [
        { id: 1, title: 'Create', status: 'complete' },
        { id: 2, title: 'Analyze', status: 'complete' },
        { id: 3, title: 'Finalize', status: 'complete' },
      ],
    },
    acceptanceCriteria: [
      'Dashboard switches to dark mode with smooth transition when user clicks theme toggle',
      'Dark mode persists across page refreshes and browser sessions',
      'System theme preference is automatically detected and applied',
      'Text contrast meets WCAG AA standards in dark mode',
    ],
    assumptions: [
      'CSS custom properties are supported in target browsers',
      'localStorage is available for persistence',
    ],
    repoPaths: ['src/app/globals.css', 'src/stores/ui.store.ts', 'src/core/components/sidebar/SidebarFooter.tsx'],
    questions: [],
    estimate: { hours: 4, confidence: 'high' },
    validationResults: [],
    techSpec: {
      problemStatement:
        'Users working in low-light environments experience eye strain when using the bright dashboard UI. Currently, there is no dark mode option, forcing users to rely on browser extensions or manual brightness adjustments. This limits accessibility and user comfort.',
      solution:
        'Implement a dark mode theme using CSS custom properties and Tailwind CSS dark mode utilities. Add a theme toggle in the sidebar header that switches between light, dark, and system preference modes. Persist the user choice to localStorage and apply it on page load. Use CSS variables to ensure consistent dark colors across all components.',
      acceptanceCriteria: [
        {
          given: 'User is on the dashboard',
          when: 'User clicks the theme toggle in the sidebar header',
          then: 'Dashboard switches to dark mode with smooth transition',
        },
        {
          given: 'Dark mode is enabled',
          when: 'User refreshes the page',
          then: 'Dark mode persists and applies on page load',
        },
        {
          given: 'User selects "System Preference"',
          when: 'System theme changes',
          then: 'Dashboard automatically switches to match system theme',
        },
        {
          given: 'All UI components are rendered',
          when: 'Dark mode is enabled',
          then: 'Text contrast meets WCAG AA standards (4.5:1 ratio)',
        },
      ],
      fileChanges: [
        { path: 'src/app/globals.css', description: 'Add dark mode color variables and Tailwind dark: utilities', layer: 'styles' },
        { path: 'src/stores/ui.store.ts', description: 'Add theme state and localStorage persistence', layer: 'state-management' },
        { path: 'src/core/components/sidebar/SidebarFooter.tsx', description: 'Add theme toggle button with icon', layer: 'frontend' },
        { path: 'src/app/layout.tsx', description: 'Apply theme class to html element on load', layer: 'frontend' },
      ],
      apiChanges: { endpoints: [], description: 'No API changes required - theme is stored client-side' },
      layeredFileChanges: {
        frontend: ['src/core/components/sidebar/SidebarFooter.tsx', 'src/app/layout.tsx'],
        state: ['src/stores/ui.store.ts'],
        styles: ['src/app/globals.css'],
      },
      testPlan: {
        unit: [
          { name: 'UI Store: Theme toggle switches modes', file: 'src/stores/ui.store.test.ts' },
          { name: 'UI Store: Theme persists to localStorage', file: 'src/stores/ui.store.test.ts' },
        ],
        integration: [
          { name: 'SidebarFooter toggle switches app theme', file: 'src/core/components/sidebar/SidebarFooter.test.tsx' },
          { name: 'Layout applies theme on mount', file: 'src/app/layout.test.tsx' },
        ],
        e2e: [{ name: 'User can toggle dark mode and theme persists', file: 'e2e/theme-toggle.spec.ts' }],
      },
      stack: {
        language: 'TypeScript',
        framework: 'Next.js 15',
        frontend: 'React 19, Tailwind CSS 4',
        state: 'Zustand',
        styling: 'CSS Variables, Tailwind Dark Mode',
        packageManager: 'pnpm',
      },
      qualityScore: 92,
    },
  } as unknown as AECResponse,

  {
    id: 'demo-2',
    workspaceId: 'demo',
    status: 'complete',
    title: 'Create OAuth service with Okta',
    description:
      'Implement OAuth 2.0 authentication service using Okta for enterprise SSO, supporting multiple identity providers and automated user provisioning.',
    type: 'feature',
    priority: 'high',
    readinessScore: 88,
    generationState: {
      currentStep: 3,
      steps: [
        { id: 1, title: 'Create', status: 'complete' },
        { id: 2, title: 'Analyze', status: 'complete' },
        { id: 3, title: 'Finalize', status: 'complete' },
      ],
    },
    acceptanceCriteria: [
      'Users can login via Okta and access protected resources',
      'JWT tokens are validated for all API requests',
      'User profiles are automatically provisioned from Okta',
      'Expired tokens are automatically refreshed',
      'User logout clears sessions and invalidates tokens',
    ],
    assumptions: [
      'Okta account with API access is configured',
      'Backend has PostgreSQL for user storage',
      'JWT library is available in project',
    ],
    repoPaths: ['src/services/okta.service.ts', 'src/auth/middleware/jwt.middleware.ts', 'client/src/lib/auth.ts'],
    questions: [],
    estimate: { hours: 24, confidence: 'high' },
    validationResults: [],
    techSpec: {
      problemStatement:
        'Currently, the application only supports local username/password authentication, which limits enterprise adoption. Enterprises require SSO capabilities with support for their corporate identity providers. This prevents seamless integration into enterprise environments and increases security risks.',
      solution:
        'Implement OAuth 2.0 authentication using Okta as the identity provider. Create an authentication service that handles OAuth flow, token management, and user session management. Add JWT token validation middleware in the API layer. Implement automatic user provisioning based on Okta user profiles. Support multiple identity sources through Okta federation.',
      acceptanceCriteria: [
        {
          given: 'An unauthenticated user visits the login page',
          when: 'User clicks "Login with Okta"',
          then: 'User is redirected to Okta login and redirected back with valid session',
        },
        {
          given: 'User is authenticated via Okta',
          when: 'API request is made',
          then: 'Request includes valid JWT token and API validates it correctly',
        },
        {
          given: 'User is first-time login from Okta',
          when: 'Authentication completes',
          then: 'User is automatically created with data from Okta user profile',
        },
        {
          given: 'JWT token is expired',
          when: 'User makes authenticated request',
          then: 'Token is automatically refreshed using refresh token',
        },
        {
          given: 'User logs out',
          when: 'Session ends',
          then: 'JWT tokens are invalidated and cookies are cleared',
        },
      ],
      fileChanges: [
        { path: 'src/services/okta.service.ts', description: 'Core Okta OAuth integration and token handling', layer: 'backend' },
        { path: 'src/auth/strategies/okta.strategy.ts', description: 'Passport.js Okta strategy configuration', layer: 'backend' },
        { path: 'src/auth/middleware/jwt.middleware.ts', description: 'JWT validation middleware for protected routes', layer: 'backend' },
        {
          path: 'src/users/application/services/UserProvisioningService.ts',
          description: 'Automatic user creation and profile sync from Okta',
          layer: 'backend',
        },
        { path: 'src/auth/controllers/okta.controller.ts', description: 'OAuth callback handlers and login endpoints', layer: 'backend' },
        { path: 'client/src/lib/auth.ts', description: 'Client-side OAuth flow and session management', layer: 'frontend' },
        { path: 'client/src/components/OktaLoginButton.tsx', description: 'Login button component that initiates OAuth flow', layer: 'frontend' },
      ],
      apiChanges: {
        endpoints: [
          { method: 'GET', path: '/api/auth/okta/login', description: 'Initiate OAuth flow - redirects to Okta', auth: false },
          { method: 'GET', path: '/api/auth/okta/callback', description: 'OAuth callback endpoint - exchanges code for token', auth: false },
          { method: 'POST', path: '/api/auth/refresh', description: 'Refresh JWT token using refresh token', auth: true },
          { method: 'POST', path: '/api/auth/logout', description: 'Invalidate session and clear tokens', auth: true },
          { method: 'GET', path: '/api/auth/me', description: 'Get current authenticated user', auth: true },
        ],
        description: 'New OAuth endpoints for Okta integration and token management',
      },
      layeredFileChanges: {
        backend: [
          'src/services/okta.service.ts',
          'src/auth/strategies/okta.strategy.ts',
          'src/auth/middleware/jwt.middleware.ts',
          'src/users/application/services/UserProvisioningService.ts',
          'src/auth/controllers/okta.controller.ts',
        ],
        frontend: ['client/src/lib/auth.ts', 'client/src/components/OktaLoginButton.tsx'],
      },
      testPlan: {
        unit: [
          { name: 'OktaService: Exchange authorization code for token', file: 'src/services/okta.service.test.ts' },
          { name: 'OktaService: Refresh token logic', file: 'src/services/okta.service.test.ts' },
          {
            name: 'UserProvisioningService: Create user from Okta profile',
            file: 'src/users/application/services/UserProvisioningService.test.ts',
          },
          { name: 'JWTMiddleware: Validate and decode token', file: 'src/auth/middleware/jwt.middleware.test.ts' },
        ],
        integration: [
          { name: 'OAuth flow: Login -> Callback -> Session created', file: 'src/auth/controllers/okta.controller.test.ts' },
          { name: 'Protected route: JWT validation blocks unauthorized requests', file: 'src/auth/middleware/jwt.middleware.test.ts' },
          { name: 'Token refresh: Expired token is automatically refreshed', file: 'src/auth/controllers/okta.controller.test.ts' },
        ],
        e2e: [
          { name: 'User can login via Okta and access protected resources', file: 'e2e/okta-login.spec.ts' },
          { name: 'User session persists across page refreshes', file: 'e2e/okta-login.spec.ts' },
          { name: 'User logout clears session and tokens', file: 'e2e/okta-logout.spec.ts' },
        ],
      },
      stack: {
        language: 'TypeScript, JavaScript',
        framework: 'NestJS, Next.js',
        authentication: 'OAuth 2.0, JWT, Okta',
        backend: 'Node.js, Express, Passport.js',
        frontend: 'React, Next.js',
        database: 'PostgreSQL, Firebase',
        packageManager: 'pnpm',
      },
      qualityScore: 88,
    },
  } as unknown as AECResponse,
];
