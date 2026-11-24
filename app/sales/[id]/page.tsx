import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { refundSaleAction } from '@/app/actions';
import { Badge, Button, Card, CardHeader, PageHeader } from '@/components/ui';
import { getSale, getSaleDetails } from '@/lib/data';
import { dateTime, money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Order detail' };
export const dynamic = 'force-dynamic';

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = getSale(Number(id));
  if (!sale) notFound();
  const details = getSaleDetails(Number(id));
  const balance = Math.max(sale.total_cents - details.paidCents, 0);

  return (
    <>
      <PageHeader
        title={`Order #${sale.id}`}
        description={`${dateTime(sale.created_at)} · ${sale.customerName || 'Walk-in'} · ${sale.channel}`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Line items" />
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {details.items.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div><p className="font-medium text-gray-900 dark:text-white">{i.productName}</p><p className="text-xs text-gray-500">{qty(i.qty, i.unitLabel)} @ {money(i.unitPriceCents)}</p></div>
                  <span className="font-medium">{money(i.lineTotalCents)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Batch traceability" description="Exact lots and unit prices consumed by this order" />
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {details.allocations.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div><p className="font-medium text-gray-900 dark:text-white">{a.productName} · {a.batchCode}</p><p className="text-xs text-gray-500">{a.supplierName || '—'} · grade {a.grade} · expires {dateTime(a.expiryDate)}</p></div>
                  <span>{qty(a.qty)} @ {money(a.unitPriceCents)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Totals" />
            <dl className="space-y-3 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{money(sale.subtotal_cents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Discount</dt><dd>-{money(sale.discount_cents)} ({sale.discount_pct}%)</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Tax</dt><dd>{money(sale.tax_cents)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-3 font-semibold dark:border-gray-800"><dt>Total</dt><dd className="text-gray-900 dark:text-white">{money(sale.total_cents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Paid</dt><dd>{money(details.paidCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Balance</dt><dd className={balance > 0 ? 'font-semibold text-amber-600' : 'text-brand-600'}>{money(balance)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><Badge tone={sale.status === 'refunded' ? 'gray' : 'green'}>{sale.status}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">COGS</dt><dd>{money(sale.cogsCents)}</dd></div>
            </dl>
          </Card>
          {sale.status !== 'refunded' && (
            <Card>
              <CardHeader title="Refund" description="Restocks batches and the product ledger" />
              <div className="p-5">
                <form action={refundSaleAction.bind(null, sale.id) as any}>
                  <Button type="submit" variant="danger">Refund this order</Button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
