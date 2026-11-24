import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Sidebar from '@/components/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GreenBasket — Fresh Produce OS',
    template: '%s · GreenBasket',
  },
  description:
    'Batch traceability, FEFO stock, cold-chain monitoring, POS and supplier finance for fruit and vegetable businesses.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="min-h-screen lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white/90 px-5 backdrop-blur lg:px-8 dark:border-gray-800 dark:bg-gray-900/90">
            <div className="pl-11 lg:pl-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">GreenBasket</p>
              <p className="hidden text-xs text-gray-500 sm:block dark:text-gray-400">
                Batch-first inventory · First-expiry-first-out selling
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <span className="size-2 rounded-full bg-brand-500" />
              Live store data
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1600px] px-5 py-7 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
