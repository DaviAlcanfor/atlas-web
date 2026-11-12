import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { cssVars } from '@/lib/palette';
import { Shell } from '@/Shell';
import '@/styles.css';

// Self-hosted at build time by next/font (no request to Google from the browser); exposed as CSS variables used by --f-sans/--f-mono.
const sans = Geist({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-geist' });
const mono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas-web-ruddy.vercel.app'),
  title: { default: 'Atlas', template: '%s · Atlas' },
  description: 'Globo 3D interativo: história, política e fatos de cada país.',
  icons: { icon: 'data:,' },
};
export const viewport: Viewport = { themeColor: '#03070c' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`} style={cssVars() as CSSProperties}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
