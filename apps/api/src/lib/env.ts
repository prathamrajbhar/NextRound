export function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function envNumber(key: string): number {
  const value = Number(env(key));
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return value;
}
