import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { purchaseOrderStatusAction } from '@/app/actions';
import ReceiveForm from '@/components/receive-form';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { getPurchaseOrder } from '@/lib/data';
import { dateTime, money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Purchase order' };
export const dynamic = 'force-dynamic';

export default async function PurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = getPurchaseOrder(Number(id));
  if (!po) notFound();

  return (
    <>
      <PageHeader
        title={po.code}
        description={`${po.supplierName} · created ${dateTime(po.created_at)}`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Line items" description="Quantities received are quality-inspected before stock is created" />
            {po.items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-5 py-3 font-medium">Product</th>
                      <th className="px-5 py-3 text-right font-medium">Ordered</th>
                      <th className="px-5 py-3 text-right font-medium">Received</th>
                      <th className="px-5 py-3 text-right font-medium">Accepted</th>
                      <th className="px-5 py-3 text-right font-medium">Rejected</th>
                      <th className="px-5 py-3 text-right font-medium">Unit cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {po.items.map((i: any) => (
                      <tr key={i.id}>
                        <td className="px-5 py-3">{i.emoji} {i.productName}</td>
                        <td className="px-5 py-3 text-right">{qty(i.qty, i.unit)}</td>
                        <td className="px-5 py-3 text-right">{qty(i.qty_received, i.unit)}</td>
                        <td className="px-5 py-3 text-right font-medium text-brand-700 dark:text-brand-300">{qty(i.qty_accepted, i.unit)}</td>
                        <td className="px-5 py-3 text-right text-red-600">{qty(i.qty_rejected, i.unit)}</td>
                        <td className="px-5 py-3 text-right">{money(i.unit_cost_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No line items" />
            )}
          </Card>

          {['ordered', 'receiving'].includes(po.status) && (
            <Card>
              <CardHeader title="Receive goods" description="Creates a dated batch with supplier and grade traceability" />
              <div className="p-5"><ReceiveForm poId={po.id} items={po.items} /></div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Order summary" />
            <dl className="space-y-3 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><Badge tone={po.status === 'completed' ? 'green' : po.status === 'cancelled' ? 'gray' : 'amber'}>{po.status}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Estimated</dt><dd className="font-semibold">{money(po.est_total_cents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Expected</dt><dd>{dateTime(po.expected_date)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Received at</dt><dd>{dateTime(po.received_at)}</dd></div>
              <div className="col-span-2"><dt className="text-gray-500">Notes</dt><dd className="mt-1 text-gray-700 dark:text-gray-200">{po.notes || '—'}</dd></div>
            </dl>
          </Card>

          {po.status === 'draft' && (
            <Card>
              <CardHeader title="Workflow" />
              <div className="flex flex-wrap gap-2 p-5">
                <form action={purchaseOrderStatusAction.bind(null, po.id, 'ordered') as any}>
                  <Button type="submit">Mark as ordered</Button>
                </form>
                <form action={purchaseOrderStatusAction.bind(null, po.id, 'cancelled') as any}>
                  <Button type="submit" variant="secondary">Cancel order</Button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
