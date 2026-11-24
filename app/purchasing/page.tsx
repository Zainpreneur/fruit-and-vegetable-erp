import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, ButtonLink, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { getPurchaseOrders } from '@/lib/data';
import { dateTime, money } from '@/lib/utils';

export const metadata: Metadata = { title: 'Purchasing' };
export const dynamic = 'force-dynamic';

export default function PurchasingPage() {
  const orders = getPurchaseOrders();
  return (
    <>
      <PageHeader
        title="Purchasing"
        description="Supplier orders, receiving inspections and batch creation"
        action={<ButtonLink href="/purchasing/new">+ New order</ButtonLink>}
      />
      <Card className="overflow-hidden">
        <CardHeader title={`${orders.length} purchase orders`} />
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Expected</th>
                  <th className="px-5 py-3 text-right font-medium">Estimated</th>
                  <th className="px-5 py-3 text-right font-medium">Received value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((po: any) => (
                  <tr key={po.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3">
                      <Link href={`/purchasing/${po.id}`} className="font-medium text-brand-600 hover:underline">{po.code}</Link>
                      <p className="text-xs text-gray-400">{po.itemCount} lines · {dateTime(po.created_at)}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{po.supplierName}</td>
                    <td className="px-5 py-3">
                      <Badge tone={po.status === 'completed' ? 'green' : po.status === 'cancelled' ? 'gray' : po.status === 'ordered' ? 'blue' : 'amber'}>{po.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{dateTime(po.expected_date)}</td>
                    <td className="px-5 py-3 text-right">{money(po.est_total_cents)}</td>
                    <td className="px-5 py-3 text-right font-medium">{money(po.receivedValueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No purchase orders" hint="Create an order to start a receiving workflow." />
        )}
      </Card>
    </>
  );
}
