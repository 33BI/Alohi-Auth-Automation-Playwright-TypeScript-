function requiredEnv(name: string): string {
  const val = process.env[name];
  if (!val || !`${val}`.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Add it to your .env, e.g.\n` +
        (name === 'AUTH_PASS' ? `AUTH_PASS="your#StrongP@ss"\n` : `${name}=value\n`)
    );
  }
  return val.trim();
}

function withQueryParam(url: string, key: string, value: string): string {
  const u = new URL(url);
  u.searchParams.set(key, value);
  return u.toString();
}

export const users = {
  valid: {
    email: requiredEnv('AUTH_EMAIL'),
    password: requiredEnv('AUTH_PASS'),
  },
};

const DEFAULT_AUTHORIZE =
  'https://id.alohi.com/realms/alohi/protocol/openid-connect/auth' +
  '?client_id=app-selector' +
  '&redirect_uri=' + encodeURIComponent('https://id.alohi.com/realms/alohi/app-selector') +
  '&response_type=code' +
  '&code_challenge_method=S256';

const rawLogin = process.env.ID_LOGIN_URL ?? DEFAULT_AUTHORIZE;

export const routes = {
  login: withQueryParam(rawLogin, 'prompt', 'login'),
  dashboard: process.env.POST_LOGIN_URL ?? 'https://id.alohi.com/realms/alohi/app-selector',
};

export const apps = {
  sign: process.env.SIGN_URL ?? 'https://app.sign.plus/',
  fax:  process.env.FAX_URL  ?? 'https://app.fax.plus/',
  dial: process.env.DIAL_URL ?? 'https://app.dial.plus/',
  scan: process.env.SCAN_URL ?? 'https://scan.plus/',
};

export const LOCKOUT_N = Number(process.env.LOCKOUT_N ?? 5);
