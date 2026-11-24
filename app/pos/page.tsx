import type { Metadata } from 'next';
import PosClient from '@/components/pos-client';
import { PageHeader } from '@/components/ui';
import { getCustomers, getProducts, getSettings } from '@/lib/data';

export const metadata: Metadata = { title: 'Point of sale' };
export const dynamic = 'force-dynamic';

export default function PosPage() {
  const products = getProducts();
  const customers = getCustomers();
  const { taxRate } = getSettings();

  return (
    <>
      <PageHeader
        title="Point of sale"
        description="Sell with automatic first-expiry-first-out batch allocation."
      />
      <PosClient products={products} customers={customers} taxRate={taxRate} />
    </>
  );
}
