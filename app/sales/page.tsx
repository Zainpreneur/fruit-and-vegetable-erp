import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { getSales } from '@/lib/data';
import { dateTime, money } from '@/lib/utils';

export const metadata: Metadata = { title: 'Sales history' };
export const dynamic = 'force-dynamic';

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const { channel } = await searchParams;
  const sales = getSales({ limit: 100, channel });
  const channels = ['all', 'retail', 'wholesale', 'b2b', 'subscription', 'online'];

  return (
    <>
      <PageHeader title="Sales history" description="Every order with FEFO batch traceability" />
      <Card className="overflow-hidden">
        <CardHeader title={`${sales.length} orders`} />
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
          {channels.map((c) => (
            <Link key={c} href={c === 'all' ? '/sales' : `/sales?channel=${c}`} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${(channel || 'all') === c ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{c}</Link>
          ))}
        </div>
        {sales.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                <tr><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Channel</th><th className="px-5 py-3 font-medium">Payment</th><th className="px-5 py-3 font-medium">When</th><th className="px-5 py-3 text-right font-medium">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3"><Link href={`/sales/${s.id}`} className="font-medium text-brand-600 hover:underline">#{s.id}</Link><span className="ml-2 text-xs text-gray-400">{s.itemCount} items</span></td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{s.customerName || 'Walk-in'}</td>
                    <td className="px-5 py-3"><Badge tone={s.channel === 'retail' ? 'gray' : 'blue'}>{s.channel}</Badge></td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{s.paymentMethod}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{dateTime(s.createdAt)}</td>
                    <td className="px-5 py-3 text-right font-medium">{money(s.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No orders in this channel" />}
      </Card>
    </>
  );
}
