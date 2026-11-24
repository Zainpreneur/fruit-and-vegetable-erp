import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, CardHeader, EmptyState, PageHeader, lifeTone } from '@/components/ui';
import { getBatches } from '@/lib/data';
import { dateTime, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Batches & stock' };
export const dynamic = 'force-dynamic';

const filters = ['all', 'fresh', 'aging', 'urgent', 'expired', 'quarantined'];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; q?: string }>;
}) {
  const { state = 'all', q = '' } = await searchParams;
  const all = getBatches();
  const rows = all.filter((b: any) => {
    const matchesState = state === 'all' || b.life === state;
    const needle = q.toLowerCase();
    const matchesQ =
      !needle ||
      String(b.code).toLowerCase().includes(needle) ||
      String(b.productName).toLowerCase().includes(needle) ||
      String(b.supplierName || '').toLowerCase().includes(needle);
    return matchesState && matchesQ;
  });

  return (
    <>
      <PageHeader
        title="Batches & stock"
        description="Traceable lots, shelf-life states and FEFO availability"
      />
      <Card className="overflow-hidden">
        <CardHeader title={`${rows.length} batches`} description="Sorted by expiry — nearest first" />
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
          {filters.map((f) => (
            <Link
              key={f}
              href={`?state=${f}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                state === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {f}
            </Link>
          ))}
          <form className="ml-auto flex gap-2" action="/inventory">
            <input type="hidden" name="state" value={state} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search batch or product…"
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <button className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900">Search</button>
          </form>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Batch</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 font-medium">Expiry</th>
                  <th className="px-5 py-3 font-medium">State</th>
                  <th className="px-5 py-3 text-right font-medium">Remaining</th>
                  <th className="px-5 py-3 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3">
                      <Link href={`/inventory/${b.id}`} className="font-medium text-brand-600 hover:underline">{b.code}</Link>
                      <p className="text-xs text-gray-400">grade {b.grade}{b.discount_pct ? ` · ${b.discount_pct}% off` : ''}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{b.emoji} {b.productName}</td>
                    <td className="px-5 py-3 text-gray-500">{b.supplierName || '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{dateTime(b.expiry_date)}</td>
                    <td className="px-5 py-3"><Badge tone={lifeTone(b.life)}>{b.life}</Badge></td>
                    <td className="px-5 py-3 text-right font-medium">{qty(b.qty_remaining, b.unit)}</td>
                    <td className="px-5 py-3 text-right text-gray-600">${(b.qty_remaining * b.unit_cost_cents / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No batches found" hint="Try a different filter or search term." />
        )}
      </Card>
    </>
  );
}
