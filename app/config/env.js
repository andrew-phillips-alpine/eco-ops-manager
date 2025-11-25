// /app/config/env.js
// Centralized environment loader for eco-ops-manager
// Reads ONLY from process.env (values injected via GitHub Secrets)

export const env = {
  // App identity
  APP_NAME: process.env.APP_NAME || 'eco-ops-manager',

  // Mock Mode toggle (defaults to true for local safety)
  USE_MOCK_DATA: process.env.USE_MOCK_DATA !== 'false',
  NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false',

  // Formspree error alerts (required)
  FORM_ENDPOINT: process.env.FORM_ENDPOINT || null,

  // Database URL
  DATABASE_URL: process.env.DATABASE_URL || null,

  // External APIs
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || null,
  UTILITY_API_URL: process.env.UTILITY_API_URL || null,
  UTILITY_API_TOKEN: process.env.UTILITY_API_TOKEN || null,

  // Runtime environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Server port
  PORT: process.env.PORT || 3000,
};

// Utility: Validate required keys at runtime
export function assertEnv(vars) {
  const missing = [];
  vars.forEach((key) => {
    if (!env[key]) {
      missing.push(key);
    }
  });
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
