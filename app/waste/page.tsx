import type { Metadata } from 'next';
import { Trash2 } from 'lucide-react';
import WasteForm from '@/components/waste-form';
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { getBatches, getProducts, getWaste } from '@/lib/data';
import { dateTime, money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Waste & spoilage' };
export const dynamic = 'force-dynamic';

export default function WastePage() {
  const data = getWaste({ days: 30 });
  const products = getProducts();
  const batches = getBatches().filter((b: any) => b.status === 'available');
  const lossCents = data.byReason.reduce((sum: number, r: any) => sum + r.valueCents, 0);

  return (
    <>
      <PageHeader title="Waste & spoilage" description="Loss events, reasons and value impact over the last 30 days" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Recorded loss" value={money(lossCents)} tone="red" icon={<Trash2 size={20} />} />
        <StatCard label="Waste events" value={String(data.byReason.reduce((s: number, r: any) => s + r.events, 0))} />
        <StatCard label="Top product" value={data.byProduct[0]?.name || '—'} hint={data.byProduct[0] ? money(data.byProduct[0].valueCents) : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Recent loss events" />
            {data.events.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-5 py-3 font-medium">Product</th>
                      <th className="px-5 py-3 font-medium">Batch</th>
                      <th className="px-5 py-3 font-medium">Reason</th>
                      <th className="px-5 py-3 text-right font-medium">Qty</th>
                      <th className="px-5 py-3 text-right font-medium">Value</th>
                      <th className="px-5 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.events.map((w: any) => (
                      <tr key={w.id}>
                        <td className="px-5 py-3">{w.emoji} {w.productName}</td>
                        <td className="px-5 py-3 text-xs text-brand-600">{w.batchCode || '—'}</td>
                        <td className="px-5 py-3"><Badge tone="amber">{w.reason}</Badge></td>
                        <td className="px-5 py-3 text-right">{qty(w.qty)}</td>
                        <td className="px-5 py-3 text-right font-medium text-red-600">{money(w.value_cents)}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{dateTime(w.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No waste recorded" hint="Great job — log losses here when they happen." />
            )}
          </Card>

          <Card>
            <CardHeader title="Loss by reason" />
            <div className="space-y-3 p-5">
              {data.byReason.length ? data.byReason.map((r: any) => (
                <div key={r.reason} className="flex items-center gap-3">
                  <span className="w-32 text-sm capitalize text-gray-700 dark:text-gray-200">{r.reason}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${lossCents ? Math.max(4, (r.valueCents / lossCents) * 100) : 0}%` }} />
                  </div>
                  <span className="w-20 text-right text-sm font-medium">{money(r.valueCents)}</span>
                </div>
              )) : <p className="text-sm text-gray-500">No losses in this period.</p>}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Record loss" description="Stock, batch balance and ledger are updated together" />
          <div className="p-5"><WasteForm products={products} batches={batches} /></div>
        </Card>
      </div>
    </>
  );
}
