type Level = "info" | "warn" | "error";

function write(level: Level, scope: string, message: string, meta?: Record<string, unknown>) {
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}`;
  const out = meta ? `${line} ${JSON.stringify(meta)}` : line;
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export function createLogger(scope: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) => write("info", scope, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => write("warn", scope, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => write("error", scope, msg, meta),
  };
}
