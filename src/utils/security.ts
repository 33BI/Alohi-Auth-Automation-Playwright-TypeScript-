export const cacheNoStore = (cc: string) =>
  /no-store|no-cache/i.test(cc) || (cc.includes('private') && cc.includes('max-age=0'));

export const hstsPresent = (h: string) => /max-age=\d+/.test(h);
