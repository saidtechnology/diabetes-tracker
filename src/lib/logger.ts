type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";
const LEVEL_SCORE: Record<LogLevel, number> = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "INFO";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_SCORE[level] <= LEVEL_SCORE[currentLevel];
}

function sanitize(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  const sensitive = ["password", "token", "secret", "code", "authorization"];
  if (Array.isArray(obj)) return obj.map(sanitize);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      sensitive.some((s) => k.toLowerCase().includes(s)) ? "[REDACTED]" : sanitize(v),
    ])
  );
}

function log(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) return;
  const entry = { timestamp: new Date().toISOString(), level, message, ...(meta ? { meta: sanitize(meta) } : {}) };
  if (level === "ERROR") console.error(JSON.stringify(entry));
  else if (level === "WARN") console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export const logger = {
  error: (message: string, meta?: unknown) => log("ERROR", message, meta),
  warn: (message: string, meta?: unknown) => log("WARN", message, meta),
  info: (message: string, meta?: unknown) => log("INFO", message, meta),
  debug: (message: string, meta?: unknown) => log("DEBUG", message, meta),
};
