/**
 * Single source of truth for frontend environment configuration.
 * Resolves API Base URL fallback across all frontend components.
 */
export const siteConfig = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api/v1',
  appName: 'HireOS',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  aiServiceUrl: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
};

export const API_BASE_URL = siteConfig.apiBaseUrl;
