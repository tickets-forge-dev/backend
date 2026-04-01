import { Skill } from '../../domain/Skill';

export const SEED_SKILLS: Omit<Skill, 'id'>[] = [
  {
    name: 'Clean Architecture',
    description: 'Keeps code organized and easy to change',
    expandedDescription:
      "Ensures the AI separates your code into clear layers — so business logic doesn't get tangled with databases, APIs, or UI. Makes the codebase easier to maintain and extend.",
    icon: 'Layers',
    category: 'architecture',
    version: '1.0.0',
    pluginDirName: 'clean-architecture',
    enabled: true,
    order: 1,
  },
  {
    name: 'Test-Driven Development',
    description: 'Writes tests before code for fewer bugs',
    expandedDescription:
      'The AI writes automated tests first, then implements the feature to pass them. Catches bugs early and ensures everything works as specified.',
    icon: 'FlaskConical',
    category: 'testing',
    version: '1.0.0',
    pluginDirName: 'tdd',
    enabled: true,
    order: 2,
  },
  {
    name: 'Security Audit',
    description: 'Checks for vulnerabilities as it codes',
    expandedDescription:
      'Scans for common security issues like injection attacks, broken authentication, and data exposure. Follows industry-standard security checklists (OWASP).',
    icon: 'ShieldCheck',
    category: 'security',
    version: '1.0.0',
    pluginDirName: 'security-audit',
    enabled: true,
    order: 3,
  },
  {
    name: 'Code Review Ready',
    description: 'Produces clean, well-documented code',
    expandedDescription:
      'The AI writes clear commit messages, adds comments where needed, and structures code so your team can review it quickly and confidently.',
    icon: 'GitPullRequest',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'code-review-ready',
    enabled: true,
    order: 4,
  },
  {
    name: 'Performance',
    description: 'Optimizes for speed and efficiency',
    expandedDescription:
      'Focuses on fast load times, efficient database queries, and minimal resource usage. Avoids common performance pitfalls.',
    icon: 'Gauge',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'performance',
    enabled: true,
    order: 5,
  },
  {
    name: 'Accessibility',
    description: 'Ensures everyone can use the interface',
    expandedDescription:
      'Makes sure the UI works with screen readers, keyboard navigation, and meets WCAG standards. Everyone deserves a great user experience.',
    icon: 'ScanEye',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'accessibility',
    enabled: true,
    order: 6,
  },
  {
    name: 'API Design',
    description: 'RESTful conventions and proper validation',
    expandedDescription:
      'Follows REST best practices with consistent naming, proper HTTP status codes, request validation, and clear error responses.',
    icon: 'Plug',
    category: 'architecture',
    version: '1.0.0',
    pluginDirName: 'api-design',
    enabled: true,
    order: 7,
  },
  {
    name: 'Error Handling',
    description: 'Typed errors and graceful failures',
    expandedDescription:
      'Implements structured error types instead of string messages, with proper try-catch boundaries and user-friendly fallbacks.',
    icon: 'ShieldAlert',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'error-handling',
    enabled: true,
    order: 8,
  },
  {
    name: 'Documentation',
    description: 'JSDoc, README updates, clear comments',
    expandedDescription:
      'Adds inline documentation, updates README files, and writes clear comments so future developers understand the intent behind the code.',
    icon: 'FileText',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'documentation',
    enabled: true,
    order: 9,
  },
  {
    name: 'Database Optimization',
    description: 'Efficient queries and proper indexing',
    expandedDescription:
      'Writes optimized database queries, adds proper indexes, and avoids N+1 problems. Keeps your app fast as data grows.',
    icon: 'Database',
    category: 'quality',
    version: '1.0.0',
    pluginDirName: 'database-optimization',
    enabled: true,
    order: 10,
  },
];
