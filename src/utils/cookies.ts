import { BrowserContext, Cookie } from '@playwright/test';

export async function findSessionCookie(ctx: BrowserContext): Promise<Cookie | null> {
  const cookies = await ctx.cookies();
  return cookies.find(c =>
    /session|sid|auth/i.test(c.name) ||
    (c.httpOnly && c.name.length > 8 && /[a-z]/i.test(c.name))
  ) ?? null;
}

export const isSecure = (c: Cookie) => !!c.secure;
