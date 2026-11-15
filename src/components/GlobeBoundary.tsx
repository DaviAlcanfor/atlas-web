import { Component, type ReactNode } from 'react';

/** A failure inside the 3D globe (WebGL lost, driver bug, three.js error) must not take the rest of the page with it. */
export class GlobeBoundary extends Component<{ onError: (msg: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(`Não foi possível iniciar o globo 3D (${error instanceof Error ? error.message : 'erro desconhecido'}). O resto do Atlas funciona normalmente.`);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** WebGL available at all? (some locked-down or very old setups have it off) */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}
