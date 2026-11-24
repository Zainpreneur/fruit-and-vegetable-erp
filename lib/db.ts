/**
 * The legacy backend uses node:sqlite directly. Its v22 typings return a
 * SQLOutputValue union (string | number | bigint | Uint8Array | null), and its
 * row objects have null prototypes — which Next.js refuses to serialize when
 * passing data from Server Components to Client Components.
 *
 * This wrapper restores plain JS objects and loose typings for the App Router.
 */
import {
  db as rawDb,
  getSetting as rawGetSetting,
  setSetting as rawSetSetting,
  nextCode as rawNextCode,
} from '@/server/legacy/db';

function plain(value: any): any {
  if (Array.isArray(value)) return value.map(plain);
  if (value !== null && typeof value === 'object' && !(value instanceof Uint8Array)) {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) out[key] = plain(value[key]);
    return out;
  }
  return value;
}

export const db: any = {
  prepare(sql: string) {
    const stmt = (rawDb as any).prepare(sql);
    return {
      get: (...args: any[]) => plain(stmt.get(...args)),
      all: (...args: any[]) => plain(stmt.all(...args)),
      run: (...args: any[]) => stmt.run(...args),
    };
  },
  exec: (sql: string) => (rawDb as any).exec(sql),
};

export const getSetting: any = rawGetSetting;
export const setSetting: any = rawSetSetting;
export const nextCode: any = rawNextCode;
export { DB_PATH } from '@/server/legacy/db';
