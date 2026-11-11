import { useEffect, useState } from 'react';

export type Async<T> = { status: 'idle' | 'loading' } | { status: 'ok'; data: T } | { status: 'error'; error: Error };

/**
 * Run an async call whenever `key` changes and expose its state. `key === null` means "nothing to load".
 *
 * Two beginner traps handled here:
 *  - an effect is code React runs AFTER rendering, and again when its dependencies change; the function it returns is the cleanup,
 *    which runs before the next run or on unmount.
 *  - race condition: click Brazil, then Japan quickly; if Brazil's answer arrives last it would overwrite Japan's.
 *    The cleanup sets `stale = true`, so an old answer is ignored.
 * The result also remembers which key it belongs to, so for one render after a change you never see the previous item's data.
 */
export function useAsync<T>(load: () => Promise<T>, key: string | number | null): Async<T> {
  const [state, setState] = useState<{ key: string | number | null; result: Async<T> }>({ key: null, result: { status: 'idle' } });
  useEffect(() => {
    if (key === null) return;
    let stale = false;
    load().then(
      (data) => !stale && setState({ key, result: { status: 'ok', data } }),
      (error: Error) => !stale && setState({ key, result: { status: 'error', error } }),
    );
    return () => { stale = true; };
    // `load` is a new function each render; the key is what identifies the request.
  }, [key]);
  if (key === null) return { status: 'idle' };
  return state.key === key ? state.result : { status: 'loading' };
}
