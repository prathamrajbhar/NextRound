export type LogLevel = 'debug' | 'http' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, http: 20, info: 30, warn: 40, error: 50 };

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  http: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

const RESET = '\x1b[0m';

function envLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return raw in LEVEL_RANK ? (raw as LogLevel) : 'info';
}

function useColor(): boolean {
  return Boolean(process.stderr.isTTY) && !process.env.NO_COLOR;
}

function shortTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function formatValue(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

export class Logger {
  constructor(private readonly namespace = 'App') {}

  child(namespace: string): Logger {
    return new Logger(namespace);
  }

  debug(message: string, ...args: unknown[]): void {
    this.write('debug', message, args);
  }

  http(message: string, ...args: unknown[]): void {
    this.write('http', message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.write('info', message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.write('warn', message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write('error', message, args);
  }

  private write(level: LogLevel, message: string, args: unknown[]): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[envLevel()]) return;

    const color = useColor();
    const time = shortTime();
    const levelTag = color
      ? `${LEVEL_COLOR[level]}${level.toUpperCase().padEnd(5)}${RESET}`
      : level.toUpperCase().padEnd(5);
    const namespace = color ? `\x1b[35m[${this.namespace}]${RESET}` : `[${this.namespace}]`;

    const suffix = args
      .map(formatValue)
      .filter(Boolean)
      .map((v) => ` ${v}`)
      .join('');
    const line = `${time}  ${levelTag}  ${namespace}  ${message}${suffix}\n`;

    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
    stream.write(line);
  }
}

export const logger = new Logger('App');
