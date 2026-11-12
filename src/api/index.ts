import { createClient } from './client';
import type { AtlasApi } from './types';

// Set in .env.production (committed, public URL) for builds; .env.local for dev; unset = mocks.
// NEXT_PUBLIC_*: inlined into the browser bundle at build time, read from the environment on the server.
const url = process.env.NEXT_PUBLIC_API_URL;
/** Mock mode when NEXT_PUBLIC_API_URL is unset or empty. Components never know which one they got. */
export const isMock = !url;

// The fixtures (~260 kB) are imported only in mock mode, so real builds do not ship them. Every AtlasApi method returns a
// promise, so a proxy can forward each call once the adapter has loaded.
let mock: Promise<AtlasApi> | undefined;
const lazyMock = new Proxy({} as AtlasApi, {
  get: (_, k: keyof AtlasApi) => (...args: unknown[]) =>
    (mock ??= import('./mocks/adapter').then((m) => m.createMockApi())).then((a) => (a[k] as (...x: unknown[]) => unknown)(...args)),
});

// Server-side calls (static generation, ISR) time out after 10 s; the page then ships without data and the browser retries.
export const api: AtlasApi = url ? createClient(url, typeof window === 'undefined' ? 10_000 : undefined) : lazyMock;
