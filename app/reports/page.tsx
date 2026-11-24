import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatCard, lifeTone } from '@/components/ui';
import { getKpis, getPerishabilityRecommendations, getProcurementSuggestions } from '@/lib/data';
import { money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Reports' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: rawDays } = await searchParams;
  const days = Math.min(Math.max(Number(rawDays) || 30, 7), 365);
  const kpis = getKpis(days);
  const procurement = getProcurementSuggestions();
  const perishability = getPerishabilityRecommendations();
  const maxCategory = Math.max(...kpis.byCategory.map((c: any) => c.revenueCents), 1);

  return (
    <>
      <PageHeader
        title="Reports & intelligence"
        description="Profitability, channel mix and perishability actions"
        action={
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <Link
                key={d}
                href={`/reports?days=${d}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${days === d ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
              >
                {d}d
              </Link>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Revenue · ${days}d`} value={money(kpis.revenueCents)} hint={`${kpis.orders} orders`} tone="green" />
        <StatCard label="Gross profit" value={money(kpis.grossProfitCents)} hint={`${kpis.marginPct}% margin`} tone="blue" />
        <StatCard label="Waste value" value={money(kpis.wasteValueCents)} hint={`${kpis.wasteEvents} events`} tone="red" />
        <StatCard label="Spoilage exposure" value={String(perishability.length)} hint="Batches inside 4-day window" tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Revenue by channel" description={`Completed sales over ${days} days`} />
          <div className="space-y-4 p-5">
            {kpis.byChannel.length ? kpis.byChannel.map((c: any) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="w-24 text-sm capitalize text-gray-700 dark:text-gray-200">{c.channel}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(3, (c.revenueCents / Math.max(...kpis.byChannel.map((x: any) => x.revenueCents), 1)) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-sm font-medium">{money(c.revenueCents)}</span>
              </div>
            )) : <p className="text-sm text-gray-500">No sales in this period.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Category mix" />
          <div className="space-y-4 p-5">
            {kpis.byCategory.length ? kpis.byCategory.map((c: any) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-700 dark:text-gray-200">{c.emoji} {c.category}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(3, (c.revenueCents / maxCategory) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-sm font-medium">{money(c.revenueCents)}</span>
              </div>
            )) : <p className="text-sm text-gray-500">No category data.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Top products" description="Ranked by revenue" />
          {kpis.topProducts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                  <tr><th className="px-5 py-3 font-medium">Product</th><th className="px-5 py-3 text-right font-medium">Sold</th><th className="px-5 py-3 text-right font-medium">Revenue</th><th className="px-5 py-3 text-right font-medium">Profit</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {kpis.topProducts.map((p: any) => (
                    <tr key={p.productName}>
                      <td className="px-5 py-3">{p.emoji} {p.productName}</td>
                      <td className="px-5 py-3 text-right">{qty(p.qtySold)}</td>
                      <td className="px-5 py-3 text-right font-medium">{money(p.revenueCents)}</td>
                      <td className="px-5 py-3 text-right text-brand-700 dark:text-brand-300">{money(p.profitCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No products sold" />}
        </Card>

        <Card>
          <CardHeader title="Perishability actions" description="Discount, dispose or bundle before value is lost" />
          {perishability.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {perishability.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.emoji} {b.productName} <span className="text-xs font-normal text-gray-400">{b.code}</span></p>
                    <p className="text-xs text-gray-500">{qty(b.qtyRemaining, b.unit)} · {money(b.valueCents)} at risk · {b.daysLeft}d left</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={lifeTone(b.life)}>{b.action}</Badge>
                    {b.suggestedDiscountPct > 0 && <span className="text-xs font-medium text-amber-600">-{b.suggestedDiscountPct}%</span>}
                    <Link href={`/inventory/${b.id}`} className="text-xs font-medium text-brand-600 hover:underline">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No batches near expiry" hint="Your perishability exposure is clear." />}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Procurement suggestions" description="Low stock plus upcoming subscription demand" />
        {procurement.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                <tr><th className="px-5 py-3 font-medium">Product</th><th className="px-5 py-3 font-medium">Reason</th><th className="px-5 py-3 text-right font-medium">On hand</th><th className="px-5 py-3 text-right font-medium">Suggested</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {procurement.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">{p.emoji} {p.name}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{p.reason}</td>
                    <td className="px-5 py-3 text-right">{qty(p.stockQty, p.unit)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-700 dark:text-brand-300">{qty(p.suggestQty, p.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No reorder suggestions" hint="Stock levels look healthy against demand." />}
      </Card>
    </>
  );
}
