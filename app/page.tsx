import Link from 'next/link';
import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  ClipboardList,
  DollarSign,
  ShoppingCart,
  Snowflake,
  TrendingUp,
} from 'lucide-react';
import RevenueChart from '@/components/revenue-chart';
import { Badge, Card, CardHeader, EmptyState, StatCard, lifeTone, Money } from '@/components/ui';
import { getDashboard, getExecutiveBrief } from '@/lib/data';
import { dateTime, daysUntil, money, qty } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const data = getDashboard();
  const brief = getExecutiveBrief();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Good day 👋 Here&apos;s your store
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Live overview of sales, shelf life and cold-chain health.
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <ShoppingCart size={16} /> Open POS
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={money(data.todayRevenueCents)}
          hint={`${data.todayOrders} orders today`}
          tone="green"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Month revenue"
          value={money(data.monthRevenueCents)}
          hint={`${data.monthOrders} orders · avg ${money(data.avgOrderCents)}`}
          tone="blue"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Stock value"
          value={money(data.stockValueCents)}
          hint={`${data.productCount} active products`}
          tone="green"
          icon={<Boxes size={20} />}
        />
        <StatCard
          label="Needs attention"
          value={String(data.lowStockCount + data.expiringSoonCount + data.coldChainBreaches)}
          hint={`${data.lowStockCount} low stock · ${data.expiringSoonCount} expiring · ${data.coldChainBreaches} breaches`}
          tone="amber"
          icon={<CircleAlert size={20} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue · last 14 days"
            description="Completed sales across every channel"
            action={
              <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                Full report <ArrowUpRight size={13} />
              </Link>
            }
          />
          <div className="p-5">
            <RevenueChart data={data.series} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Executive brief" description="What needs your attention today" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500">Today</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  <Money cents={brief.todayRevenueCents} />
                </p>
                <p className="text-xs text-gray-400">{brief.todayOrders} orders</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500">7-day daily avg</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  <Money cents={brief.weekAvgDailyCents} />
                </p>
                <p className="text-xs text-gray-400">rolling</p>
              </div>
            </div>
            {brief.recommendedActions.length ? (
              <ul className="space-y-2">
                {brief.recommendedActions.map((action) => (
                  <li key={action} className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    <CircleAlert size={14} className="mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Everything looks healthy right now.</p>
            )}
            {brief.coldChainBreaches.length > 0 && (
              <Link href="/cold-chain" className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                <Snowflake size={13} /> Inspect {brief.coldChainBreaches.length} cold-chain breach(es)
              </Link>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Expiry watchlist"
            description="Batches with the shortest shelf life left"
            action={
              <Link href="/inventory" className="text-xs font-medium text-brand-600 hover:underline">
                View all
              </Link>
            }
          />
          {data.urgentBatches.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.urgentBatches.map((b: any) => (
                <Link
                  key={b.id}
                  href={`/inventory/${b.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{b.emoji || '🥬'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{b.productName}</p>
                      <p className="text-xs text-gray-500">
                        {b.code} · {qty(b.qtyRemaining, b.unit)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={lifeTone('urgent')}>{daysUntil(b.expiryDate)}d left</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No urgent batches" hint="Nothing is close to expiry right now." />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Low stock"
            description="Items at or below their reorder level"
            action={
              <Link href="/purchasing" className="text-xs font-medium text-brand-600 hover:underline">
                Create PO
              </Link>
            }
          />
          {data.lowStock.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.lowStock.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.emoji || '🥬'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">Reorder at {qty(p.reorderLevel, p.unit)}</p>
                    </div>
                  </div>
                  <Badge tone={p.stockQty <= 0 ? 'red' : 'amber'}>{qty(p.stockQty, p.unit)}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="All stocked up" hint="Every active product is above its reorder level." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent orders"
          description="Latest sales across retail, wholesale and B2B"
          action={
            <Link href="/sales" className="text-xs font-medium text-brand-600 hover:underline">
              All orders
            </Link>
          }
        />
        {data.recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Channel</th>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.recentOrders.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3">
                      <Link href={`/sales/${s.id}`} className="font-medium text-brand-600 hover:underline">
                        #{s.id}
                      </Link>
                      <span className="ml-2 text-xs text-gray-400">{s.itemCount} items</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{s.customerName || 'Walk-in'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={s.channel === 'retail' ? 'gray' : 'blue'}>{s.channel}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{dateTime(s.createdAt)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">
                      <Money cents={s.totalCents} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No orders yet" hint="Open the POS to create the first sale." />
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <ClipboardList size={13} /> {data.openPOs} open purchase orders · {data.customerCount} customers
      </div>
    </div>
  );
}
