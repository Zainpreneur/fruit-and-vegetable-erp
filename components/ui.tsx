import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn, money } from '@/lib/utils';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        variant === 'primary'
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
      )}
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' &&
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
    >
      {children}
    </button>
  );
}

const badgeStyles: Record<string, string> = {
  green: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
};

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: keyof typeof badgeStyles;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        badgeStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

export function lifeTone(state: string): keyof typeof badgeStyles {
  if (state === 'expired' || state === 'quarantined' || state === 'disposed' || state === 'breach')
    return 'red';
  if (state === 'urgent' || state === 'aging' || state === 'partial') return 'amber';
  if (state === 'fresh' || state === 'pass' || state === 'completed' || state === 'available')
    return 'green';
  return 'gray';
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'gray',
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof badgeStyles;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
        {icon && (
          <span className={cn('rounded-xl p-2.5', badgeStyles[tone])}>{icon}</span>
        )}
      </div>
    </Card>
  );
}

export function Money({ cents }: { cents: number }) {
  return <>{money(cents)}</>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-5 py-12 text-center">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
      {hint && <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
