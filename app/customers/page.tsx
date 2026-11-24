import type { Metadata } from 'next';
import CustomerForm from '@/components/customer-form';
import { Badge, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { getCustomers, getReceivables, getSubscriptions } from '@/lib/data';
import { dateTime, money } from '@/lib/utils';

export const metadata: Metadata = { title: 'Customers' };
export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  const customers = getCustomers();
  const subscriptions = getSubscriptions();
  const receivables = getReceivables();
  const outstanding = receivables.reduce((sum: number, r: any) => sum + Math.max(r.totalCents - r.paidCents, 0), 0);

  return (
    <>
      <PageHeader title="Customers" description="Retail, reseller and B2B relationships with subscriptions" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={`${customers.length} customers`} description={`${outstanding / 100} in outstanding B2B receivables`} />
            {customers.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone || '—'} · {c.email || 'no email'}</p>
                      {c.notes && <p className="mt-0.5 text-xs text-gray-400">{c.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={c.segment === 'retail' ? 'gray' : 'blue'}>{c.segment}</Badge>
                      {c.payment_terms && <span className="text-xs text-gray-400">{c.payment_terms}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No customers yet" />}
          </Card>

          <Card>
            <CardHeader title="Subscriptions" description="Recurring produce boxes and their next run" />
            {subscriptions.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {subscriptions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.customerName} · {s.itemCount} items · every {s.freq_days}d</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Next: {dateTime(s.next_run)}</span>
                      <Badge tone={s.active ? 'green' : 'gray'}>{s.active ? 'active' : 'paused'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No subscriptions" />}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Add customer" />
            <div className="p-5"><CustomerForm /></div>
          </Card>
          <Card>
            <CardHeader title="Receivables" description="Open invoice sales" />
            {receivables.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {receivables.slice(0, 8).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{r.customerName || 'Walk-in'}</p>
                      <p className="text-xs text-gray-500">Due {dateTime(r.dueDate)}</p>
                    </div>
                    <span className="font-medium text-amber-600">{money(Math.max(r.totalCents - r.paidCents, 0))}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="Nothing outstanding" />}
          </Card>
        </div>
      </div>
    </>
  );
}
