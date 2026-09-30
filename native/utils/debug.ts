// Debug toolkit: global error handling, timestamped console, fetch logging, Firestore verbose logs
import { LogBox, Platform } from 'react-native';
import { setLogLevel } from 'firebase/firestore';

// Preserve originals
const original = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

function ts() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

if (__DEV__) {
  try { LogBox.ignoreAllLogs(false); } catch {}

  // Timestamped console
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shouldSuppress = (args: any[]) => {
    if (Platform.OS !== 'web') return false;
    const msg = args && args.length > 0 ? args[0] : '';
    if (typeof msg !== 'string') return false;
    return msg.includes('Unexpected text node:') || msg.includes('findDOMNode is deprecated');
  };

  const wrap = (level: 'log' | 'warn' | 'error' | 'info' | 'debug') => (...args: any[]) => {
    if (shouldSuppress(args)) return;
    // Avoid logging our own verbose Firestore logs twice; still show them but timestamped
    original[level](`[${ts()}] [${level.toUpperCase()}]`, ...args);
  };

  console.log = wrap('log');
  console.warn = wrap('warn');
  console.error = wrap('error');
  console.info = wrap('info');
  console.debug = wrap('debug');

  // Global error handler (RN JS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalHandler = (error: any, isFatal?: boolean) => {
    original.error('[GlobalError]', { fatal: !!isFatal, message: error?.message }, error?.stack || error);
  };
  // @ts-ignore - ErrorUtils exists in RN runtime
  if (global.ErrorUtils?.setGlobalHandler) {
    // @ts-ignore
    global.ErrorUtils.setGlobalHandler(globalHandler);
  }

  // Unhandled promise rejections
  try {
    // @ts-ignore
    const rej = (event: any) => {
      const reason = event?.reason || event;
      original.error('[UnhandledRejection]', reason?.message || reason, reason?.stack || reason);
    };
    // @ts-ignore
    if (global.addEventListener) {
      // @ts-ignore
      global.addEventListener('unhandledrejection', rej);
    } else {
      // @ts-ignore
      global.onunhandledrejection = rej;
    }
  } catch {}

  // Fetch logger
  // @ts-ignore
  const originalFetch = global.fetch?.bind(global) || fetch;
  // @ts-ignore
  global.fetch = async (input: RequestInfo, init?: RequestInit) => {
    const start = Date.now();
    const method = (init?.method || 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : (input as any)?.url || 'unknown';
    try {
      // @ts-ignore
      const res = await originalFetch(input, init);
      const ms = Date.now() - start;
      original.info(`[HTTP] ${method} ${url} -> ${res.status} ${res.ok ? 'OK' : 'FAIL'} (${ms}ms)`);
      return res;
    } catch (e) {
      const ms = Date.now() - start;
      original.error(`[HTTP] ${method} ${url} -> ERROR (${ms}ms)`, e);
      throw e;
    }
  };

  // Firestore verbose logs
  try { setLogLevel('debug'); } catch {}

  // Helpful startup banner
  original.info(`Debug tools active (${Platform.OS}) — timestamps, HTTP, Firestore logs enabled`);
}
