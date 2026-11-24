import type { Metadata } from 'next';
import ProductForm from '@/components/product-form';
import { Card, CardHeader, PageHeader } from '@/components/ui';
import { getCategories, getSuppliers } from '@/lib/data';

export const metadata: Metadata = { title: 'Add product' };
export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  const categories = getCategories();
  const suppliers = getSuppliers();
  return (
    <>
      <PageHeader title="Add product" description="Create a SKU with storage and shelf-life rules." />
      <Card>
        <CardHeader title="Product details" description="Prices are entered in cents." />
        <div className="p-5">
          <ProductForm categories={categories} suppliers={suppliers} />
        </div>
      </Card>
    </>
  );
}
