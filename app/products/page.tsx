import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, ButtonLink, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { getProducts } from '@/lib/data';
import { money, qty } from '@/lib/utils';

export const metadata: Metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const products = getProducts();

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} active SKUs with perishability and supplier metadata`}
        action={<ButtonLink href="/products/new">+ Add product</ButtonLink>}
      />
      <Card className="overflow-hidden">
        <CardHeader title="Catalogue" description="Click a product for stock batches and restocking" />
        {products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 font-medium">Storage</th>
                  <th className="px-5 py-3 font-medium">Shelf life</th>
                  <th className="px-5 py-3 text-right font-medium">Stock</th>
                  <th className="px-5 py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3">
                      <Link href={`/products/${p.id}`} className="flex items-center gap-2 font-medium text-gray-900 hover:text-brand-600 dark:text-white">
                        <span className="text-lg">{p.emoji || '🥬'}</span>
                        <span>{p.name}<span className="ml-2 text-xs font-normal text-gray-400">{p.sku}</span></span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.category || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.supplier || '—'}</td>
                    <td className="px-5 py-3"><Badge tone={p.storageReq === 'chilled' || p.storageReq === 'cold' ? 'blue' : 'gray'}>{p.storageReq}</Badge></td>
                    <td className="px-5 py-3 text-gray-500">{p.shelfLifeDays}d</td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={p.stockQty <= 0 ? 'red' : p.stockQty <= p.reorderLevel ? 'amber' : 'green'}>
                        {qty(p.stockQty, p.unit)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">{money(p.priceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No products" hint="Add your first product to start selling." />
        )}
      </Card>
    </>
  );
}
