import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BatchActions from '@/components/batch-actions';
import { Badge, Card, CardHeader, EmptyState, PageHeader, lifeTone } from '@/components/ui';
import { getBatch } from '@/lib/data';
import { dateTime, daysUntil, money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Batch detail' };
export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = getBatch(Number(id));
  if (!batch) notFound();

  return (
    <>
      <PageHeader
        title={`${batch.emoji || '🥬'} ${batch.code}`}
        description={`${batch.productName} · grade ${batch.grade} · ${batch.zoneName || 'no zone'}`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Quality inspections" description="Scored at receiving" />
            {batch.inspections.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {batch.inspections.map((i: any) => (
                  <div key={i.id} className="space-y-2 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{i.inspector || 'Inspector'}</p>
                      <Badge tone={lifeTone(i.result)}>{i.result}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        ['Appearance', i.appearance],
                        ['Firmness', i.firmness],
                        ['Ripeness', i.ripeness],
                        ['Damage', i.damage],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-lg bg-gray-50 py-2 dark:bg-gray-800/50">
                          <p className="text-gray-500">{label}</p>
                          <p className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">{String(value)}/5</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Accepted {qty(i.accepted_qty, batch.unit)} · rejected {qty(i.rejected_qty, batch.unit)}
                      {i.temp_c != null ? ` · ${i.temp_c}°C` : ''}
                      {i.notes ? ` · ${i.notes}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No inspections recorded" />
            )}
          </Card>

          <Card>
            <CardHeader title="Sales allocations" description="Which orders consumed this lot" />
            {batch.allocations.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {batch.allocations.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-brand-600">{a.saleCode}</span>
                    <span className="text-gray-500">{qty(a.qty, batch.unit)} @ {money(a.unit_price_cents)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Not yet sold" hint="This batch is still available for FEFO picking." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Batch position" />
            <dl className="space-y-3 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">State</dt><dd><Badge tone={lifeTone(batch.life)}>{batch.life}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Remaining</dt><dd className="font-semibold">{qty(batch.qty_remaining, batch.unit)} / {qty(batch.qty_initial, batch.unit)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Received</dt><dd>{dateTime(batch.received_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Harvest</dt><dd>{dateTime(batch.harvest_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Expires</dt><dd>{dateTime(batch.expiry_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Days left</dt><dd className={daysUntil(batch.expiry_date) <= 2 ? 'font-semibold text-red-600' : ''}>{daysUntil(batch.expiry_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Origin</dt><dd>{batch.origin || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Unit cost</dt><dd>{money(batch.unit_cost_cents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Value</dt><dd className="font-semibold">{money(batch.qty_remaining * batch.unit_cost_cents)}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Batch actions" description="Markdown, quarantine or dispose" />
            <div className="p-5"><BatchActions batchId={batch.id} /></div>
          </Card>
        </div>
      </div>
    </>
  );
}
