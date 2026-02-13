/**
 * OAuthConfigValidator - Validate OAuth configuration on startup
 * Ensures all required environment variables are set before app starts
 */
export function validateOAuthConfig(): void {
  const requiredVars = {
    figma: [
      { name: 'FIGMA_CLIENT_ID', used: 'Figma OAuth app ID' },
      { name: 'FIGMA_CLIENT_SECRET', used: 'Figma OAuth app secret' },
      { name: 'FIGMA_OAUTH_REDIRECT_URI', used: 'Figma OAuth callback URL' },
    ],
    loom: [
      { name: 'LOOM_CLIENT_ID', used: 'Loom OAuth app ID' },
      { name: 'LOOM_CLIENT_SECRET', used: 'Loom OAuth app secret' },
      { name: 'LOOM_OAUTH_REDIRECT_URI', used: 'Loom OAuth callback URL' },
    ],
  };

  const missing: string[] = [];

  // Check Figma config (optional but warn if incomplete)
  const figmaVars = requiredVars.figma.map((v) => process.env[v.name]);
  const figmaConfigured = figmaVars.some((v) => v);
  if (figmaConfigured && figmaVars.some((v) => !v)) {
    missing.push(
      `Figma OAuth partially configured. Missing: ${requiredVars.figma
        .filter((v) => !process.env[v.name])
        .map((v) => v.name)
        .join(', ')}`,
    );
  }

  // Check Loom config (optional but warn if incomplete)
  const loomVars = requiredVars.loom.map((v) => process.env[v.name]);
  const loomConfigured = loomVars.some((v) => v);
  if (loomConfigured && loomVars.some((v) => !v)) {
    missing.push(
      `Loom OAuth partially configured. Missing: ${requiredVars.loom
        .filter((v) => !process.env[v.name])
        .map((v) => v.name)
        .join(', ')}`,
    );
  }

  if (missing.length > 0) {
    console.warn('⚠️  OAuth Configuration Warnings:');
    missing.forEach((msg) => console.warn(`  - ${msg}`));
    console.warn(
      'Design link integration will work, but metadata enrichment disabled.\n',
    );
  }

  // Validate redirect URIs are HTTPS (security check)
  const redirectUris = [
    process.env.FIGMA_OAUTH_REDIRECT_URI,
    process.env.LOOM_OAUTH_REDIRECT_URI,
  ].filter(Boolean);

  const httpRedirects = redirectUris.filter(
    (uri) => uri && !uri.startsWith('https://'),
  );
  if (httpRedirects.length > 0) {
    console.error('❌ OAuth Redirect URIs must use HTTPS:');
    httpRedirects.forEach((uri) => console.error(`  - ${uri}`));
    console.error(
      'Set FIGMA_OAUTH_REDIRECT_URI and LOOM_OAUTH_REDIRECT_URI to HTTPS URLs\n',
    );
    // Don't throw - allow for local dev with special handling
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OAuth redirect URIs must use HTTPS in production');
    }
  }
}
