'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Snowflake,
  Trash2,
  Users,
  X,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const groups = [
  {
    label: 'Workspace',
    links: [
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/pos', label: 'Point of sale', icon: ShoppingCart },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/inventory', label: 'Batches & stock', icon: Boxes },
    ],
  },
  {
    label: 'Operations',
    links: [
      { href: '/purchasing', label: 'Purchasing', icon: ClipboardList },
      { href: '/cold-chain', label: 'Cold chain', icon: Snowflake },
      { href: '/waste', label: 'Waste & spoilage', icon: Trash2 },
    ],
  },
  {
    label: 'Insights',
    links: [
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/sales', label: 'Sales history', icon: ShoppingCart },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-theme-sm lg:hidden dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-6 dark:border-gray-800">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white">🥬</span>
          <div>
            <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">GreenBasket</p>
            <p className="text-xs text-gray-400">Fresh produce OS</p>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map(({ href, label, icon: Icon }) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn('menu-item group', active ? 'menu-item-active' : 'menu-item-inactive')}
                    >
                      <Icon size={18} className={active ? 'menu-item-icon-active' : 'menu-item-icon-inactive'} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <p className="text-xs text-gray-400">Next.js App Router · v1.0</p>
        </div>
      </aside>
    </>
  );
}
