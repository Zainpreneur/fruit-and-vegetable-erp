import type { Metadata } from 'next';
import PoForm from '@/components/po-form';
import { Card, CardHeader, PageHeader } from '@/components/ui';
import { getProducts, getSuppliers } from '@/lib/data';

export const metadata: Metadata = { title: 'New purchase order' };
export const dynamic = 'force-dynamic';

export default function NewPoPage() {
  const suppliers = getSuppliers();
  const products = getProducts();
  return (
    <>
      <PageHeader title="New purchase order" description="Draft an order; receive it later to create traceable batches." />
      <Card>
        <CardHeader title="Order details" />
        <div className="p-5"><PoForm suppliers={suppliers} products={products} /></div>
      </Card>
    </>
  );
}
