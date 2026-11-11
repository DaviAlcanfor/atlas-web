import { createClient } from './client';
import { createMockApi } from './mocks/adapter';
import type { AtlasApi } from './types';

// Set in .env.production (committed, public URL) for builds; .env.local for dev; unset = mocks.
const url = import.meta.env.VITE_API_URL as string | undefined;
/** Mock mode when VITE_API_URL is unset or empty. Components never know which one they got. */
export const isMock = !url;
export const api: AtlasApi = url ? createClient(url) : createMockApi();
