export function withApiLogging(handler) {
  return async function loggedHandler(req, ctx) {
    const start = Date.now();
    try {
      const res = await handler(req, ctx);
      logApiResponse(req, res, start);
      return res;
    } catch (err) {
      logApiError(req, err, start);
      throw err;
    }
  };
}

function logApiResponse(req, res, start) {
  const url = req.nextUrl || new URL(req.url);
  const decodedPath = safeDecodeUrl(`${url.pathname}${url.search}`);
  const durationMs = Date.now() - start;
  const logLevel = getLogLevel();
  if (logLevel === 'silent') {
    return;
  }

  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  let message = `[api] ${req.method} ${decodedPath} ${res.status} ${durationMs}ms ip=${ip}`;
  if (logLevel === 'debug') {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    message += ` ua="${userAgent}"`;
  }

  console.log(message);
}

function logApiError(req, err, start) {
  const url = req.nextUrl || new URL(req.url);
  const decodedPath = safeDecodeUrl(`${url.pathname}${url.search}`);
  const durationMs = Date.now() - start;
  const message = err?.message || 'unknown error';
  const logLevel = getLogLevel();
  if (logLevel === 'silent') {
    return;
  }

  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  let logLine = `[api] ${req.method} ${decodedPath} 500 ${durationMs}ms ip=${ip} error="${message}"`;
  if (logLevel === 'debug') {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    logLine += ` ua="${userAgent}"`;
  }

  console.log(logLine);
}

function safeDecodeUrl(value) {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
}

function getLogLevel() {
  const level = process.env.API_LOG_LEVEL || process.env.LOG_LEVEL || 'info';
  return level.toLowerCase();
}
