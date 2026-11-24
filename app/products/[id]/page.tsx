import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RestockForm from '@/components/restock-form';
import { Badge, Card, CardHeader, EmptyState, PageHeader, lifeTone } from '@/components/ui';
import { getBatches, getProduct } from '@/lib/data';
import { dateTime, daysUntil, money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Product detail' };
export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) notFound();
  const batches = getBatches().filter((b: any) => b.product_id === product.id);

  return (
    <>
      <PageHeader
        title={`${product.emoji || '🥬'} ${product.name}`}
        description={`${product.sku} · ${product.category || 'Uncategorised'} · supplied by ${product.supplier || '—'}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Stock batches" description="Oldest expiry first — this is the FEFO picking order" />
            {batches.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {batches.map((b: any) => (
                  <Link key={b.id} href={`/inventory/${b.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{b.code} · grade {b.grade}</p>
                      <p className="text-xs text-gray-500">
                        Received {dateTime(b.received_at)} · expires {dateTime(b.expiry_date)}
                        {b.discount_pct > 0 ? ` · ${b.discount_pct}% markdown` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{qty(b.qty_remaining, product.unit)}</p>
                      <Badge tone={lifeTone(b.life)}>{b.daysLeft}d left</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No batches" hint="Restock this product to create a traceable batch." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Stock position" />
            <dl className="space-y-3 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">On hand</dt><dd className="font-semibold text-gray-900 dark:text-white">{qty(product.stockQty, product.unit)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Reorder at</dt><dd className="font-medium">{qty(product.reorderLevel, product.unit)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Cost</dt><dd>{money(product.costCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Retail</dt><dd className="font-medium text-brand-700 dark:text-brand-300">{money(product.priceCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Wholesale</dt><dd>{money(product.wholesalePriceCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Shelf life</dt><dd>{product.shelfLifeDays} days</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Storage</dt><dd className="capitalize">{product.storageReq}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Origin</dt><dd>{product.origin || '—'}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Restock" description="Creates an inventory ledger entry" />
            <div className="p-5"><RestockForm productId={product.id} /></div>
          </Card>
        </div>
      </div>
    </>
  );
}
