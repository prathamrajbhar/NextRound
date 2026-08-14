const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const NEXT_PUBLIC_AI_BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL;

if (!NEXT_PUBLIC_API_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL');
}
if (!NEXT_PUBLIC_APP_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_APP_URL');
}
if (!NEXT_PUBLIC_AI_BASE_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_AI_BASE_URL');
}

export const siteConfig = {
  apiBaseUrl: NEXT_PUBLIC_API_URL,
  appName: 'HireOS',
  appUrl: NEXT_PUBLIC_APP_URL,
  aiServiceUrl: NEXT_PUBLIC_AI_BASE_URL,
};

export const API_BASE_URL = siteConfig.apiBaseUrl;