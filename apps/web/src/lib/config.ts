function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const siteConfig = {
  apiBaseUrl: requiredEnv('NEXT_PUBLIC_API_URL'),
  appName: 'HireOS',
  appUrl: requiredEnv('NEXT_PUBLIC_APP_URL'),
  aiServiceUrl: requiredEnv('NEXT_PUBLIC_AI_BASE_URL'),
};

export const API_BASE_URL = siteConfig.apiBaseUrl;