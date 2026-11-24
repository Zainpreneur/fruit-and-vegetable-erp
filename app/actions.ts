'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, getSetting, setSetting, nextCode } from '@/lib/db';
import { createSale as rawCreateSale } from '@/server/legacy/sale-core';
import { createBatch as rawCreateBatch } from '@/server/legacy/domain';

const createSale: any = rawCreateSale;
const createBatch: any = rawCreateBatch;

export type ActionResult = { ok: true; message: string; id?: number } | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

function refresh() {
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/inventory');
  revalidatePath('/pos');
  revalidatePath('/purchasing');
  revalidatePath('/reports');
}

export async function checkoutAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const schema = z.object({
    items: z.string().min(2),
    customerId: z.string().optional(),
    channel: z.enum(['retail', 'wholesale', 'b2b', 'subscription', 'online']),
    paymentMethod: z.enum(['cash', 'card', 'mobile', 'invoice']),
    discountPct: z.coerce.number().min(0).max(100),
    note: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Check the sale details and try again.');

  const items = z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().positive() }))
    .min(1)
    .safeParse(JSON.parse(parsed.data.items));
  if (!items.success) return fail('Add at least one product to the cart.');

  const { customerId, channel, paymentMethod, discountPct, note } = parsed.data;
  if (channel !== 'retail' && !customerId) return fail(`${channel} sales require a customer.`);

  try {
    const sale = createSale({
      items: items.data,
      customerId: customerId ? Number(customerId) : null,
      discountPct,
      paymentMethod,
      channel,
      note: note || '',
    });
    refresh();
    revalidatePath(`/sales/${sale.id}`);
    return { ok: true, message: `Sale #${sale.id} completed`, id: sale.id };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not complete the sale.');
  }
}

export async function createProductAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const schema = z.object({
    name: z.string().trim().min(1).max(120),
    sku: z.string().trim().max(40).optional(),
    categoryId: z.string().optional(),
    supplierId: z.string().optional(),
    unit: z.enum(['kg', 'pcs', 'bunch', 'pack', 'dozen']),
    costCents: z.coerce.number().int().min(0),
    priceCents: z.coerce.number().int().min(0),
    wholesalePriceCents: z.coerce.number().int().min(0).optional(),
    stockQty: z.coerce.number().min(0),
    reorderLevel: z.coerce.number().min(0),
    shelfLifeDays: z.coerce.number().int().min(1).max(365),
    storageReq: z.enum(['ambient', 'chilled', 'cold', 'dry']),
    emoji: z.string().max(8).optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Please check the product fields.');
  const b = parsed.data;
  try {
    const prefixMap: Record<string, string> = { Fruits: 'FRU', Vegetables: 'VEG', Herbs: 'HRB', Exotic: 'EXO' };
    const cat = b.categoryId ? db.prepare('SELECT name FROM categories WHERE id=?').get(b.categoryId) : null;
    const prefix = cat ? prefixMap[cat.name] || 'GEN' : 'GEN';
    const count = db.prepare('SELECT COUNT(*) AS c FROM products WHERE sku LIKE ?').get(`${prefix}-%`).c;
    const sku = b.sku || `${prefix}-${String(count + 1).padStart(3, '0')}`;
    db.exec('BEGIN');
    try {
      db.prepare(
        `INSERT INTO products (sku,name,emoji,category_id,supplier_id,unit,cost_cents,price_cents,wholesale_price_cents,
          stock_qty,reorder_level,shelf_life_days,storage_req,active,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,datetime('now'))`,
      ).run(
        sku, b.name, b.emoji || '', b.categoryId || null, b.supplierId || null, b.unit,
        b.costCents, b.priceCents, b.wholesalePriceCents || 0, b.stockQty, b.reorderLevel,
        b.shelfLifeDays, b.storageReq,
      );
      if (b.stockQty > 0) {
        db.prepare(
          "INSERT INTO inventory_log (product_id,change_qty,reason,note,created_at) VALUES (?,?,'restock','Opening stock',datetime('now'))",
        ).run(db.prepare('SELECT id FROM products WHERE sku=?').get(sku).id, b.stockQty);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    refresh();
    return { ok: true, message: `${b.name} added (${sku})` };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not create the product.');
  }
}

export async function restockAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      productId: z.coerce.number().int().positive(),
      qty: z.coerce.number().positive(),
      note: z.string().max(200).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Enter a valid quantity.');
  const { productId, qty, note } = parsed.data;
  try {
    db.exec('BEGIN');
    db.prepare('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?').run(qty, productId);
    db.prepare(
      "INSERT INTO inventory_log (product_id,change_qty,reason,note,created_at) VALUES (?,?,'restock',?,datetime('now'))",
    ).run(productId, qty, note || 'Manual restock');
    db.exec('COMMIT');
    refresh();
    return { ok: true, message: `Restocked ${qty}` };
  } catch (e) {
    db.exec('ROLLBACK');
    return fail(e instanceof Error ? e.message : 'Restock failed.');
  }
}

export async function createCustomerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(1),
      phone: z.string().max(40).optional(),
      email: z.string().max(120).optional(),
      segment: z.enum(['retail', 'reseller', 'restaurant', 'b2b']),
      paymentTerms: z.string().max(40).optional(),
      notes: z.string().max(300).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Please check the customer details.');
  const b = parsed.data;
  db.prepare(
    'INSERT INTO customers (name,phone,email,notes,segment,payment_terms,created_at) VALUES (?,?,?,?,?,?,datetime(\'now\'))',
  ).run(b.name, b.phone || '', b.email || '', b.notes || '', b.segment, b.paymentTerms || '');
  revalidatePath('/customers');
  revalidatePath('/pos');
  return { ok: true, message: `${b.name} added` };
}

export async function createPurchaseOrderAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      supplierId: z.coerce.number().int().positive(),
      expectedDate: z.string().optional(),
      notes: z.string().max(300).optional(),
      items: z.string().min(2),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Please check the purchase order.');
  const items = z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().positive(), unitCostCents: z.number().int().min(0) }))
    .min(1)
    .safeParse(JSON.parse(parsed.data.items));
  if (!items.success) return fail('Add at least one valid line item.');
  const est = items.data.reduce((sum, i) => sum + Math.round(i.qty * i.unitCostCents), 0);
  try {
    db.exec('BEGIN');
    const r = db.prepare(
      `INSERT INTO purchase_orders (code,supplier_id,status,expected_date,est_total_cents,notes,created_at)
       VALUES (?,?,'draft',?,?,?,datetime('now'))`,
    ).run(nextCode('PO', 'purchase_orders'), parsed.data.supplierId, parsed.data.expectedDate || null, est, parsed.data.notes || '');
    const poId = Number(r.lastInsertRowid);
    const ins = db.prepare('INSERT INTO po_items (po_id,product_id,qty,unit_cost_cents) VALUES (?,?,?,?)');
    for (const i of items.data) ins.run(poId, i.productId, i.qty, i.unitCostCents);
    db.exec('COMMIT');
    refresh();
    return { ok: true, message: `Purchase order created`, id: poId };
  } catch (e) {
    db.exec('ROLLBACK');
    return fail(e instanceof Error ? e.message : 'Could not create purchase order.');
  }
}

export async function purchaseOrderStatusAction(id: number, status: 'ordered' | 'cancelled') {
  const po = db.prepare('SELECT status FROM purchase_orders WHERE id=?').get(id);
  if (!po) return fail('Purchase order not found.');
  if (po.status !== 'draft' && !(status === 'cancelled' && po.status === 'ordered'))
    return fail(`Cannot change a ${po.status} order.`);
  db.prepare('UPDATE purchase_orders SET status=? WHERE id=?').run(status, id);
  refresh();
  return { ok: true, message: `Order ${status}` } as ActionResult;
}

export async function receivePurchaseOrderAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      poId: z.coerce.number().int().positive(),
      inspector: z.string().max(80).optional(),
      lines: z.string().min(2),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Check the receiving form.');
  const lines = z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        acceptedQty: z.number().min(0),
        rejectedQty: z.number().min(0),
        grade: z.enum(['A', 'B', 'C']).optional(),
      }),
    )
    .safeParse(JSON.parse(parsed.data.lines));
  if (!lines.success) return fail('Invalid receiving lines.');

  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(parsed.data.poId);
  if (!po) return fail('Purchase order not found.');
  if (!['ordered', 'receiving'].includes(po.status)) return fail(`PO is ${po.status}.`);

  const items = db.prepare('SELECT * FROM po_items WHERE po_id=?').all(po.id);
  const byId = Object.fromEntries(items.map((i: any) => [i.id, i]));
  const now = new Date().toISOString();
  try {
    db.exec('BEGIN');
    for (const line of lines.data) {
      const item = byId[line.itemId];
      if (!item) throw new Error(`Unknown line ${line.itemId}`);
      const arrived = line.acceptedQty + line.rejectedQty;
      if (arrived <= 0) continue;
      const remaining = item.qty - item.qty_received;
      if (arrived > remaining + item.qty * 0.1 + 1e-9) throw new Error(`Line ${item.id} exceeds remaining quantity.`);
      if (line.acceptedQty > 0) {
        const product = db.prepare('SELECT * FROM products WHERE id=?').get(item.product_id);
        const batch = createBatch({
          product,
          supplierId: po.supplier_id,
          poId: po.id,
          origin: product.origin || '',
          receivedAt: now,
          qty: line.acceptedQty,
          unitCostCents: item.unit_cost_cents,
          grade: line.grade || 'A',
        });
        db.prepare('UPDATE products SET stock_qty = stock_qty + ?, cost_cents = ? WHERE id=?').run(
          line.acceptedQty,
          item.unit_cost_cents,
          product.id,
        );
        db.prepare(
          "INSERT INTO inventory_log (product_id,change_qty,reason,note,created_at) VALUES (?,?,'restock',?,?)",
        ).run(product.id, line.acceptedQty, `Received against ${po.code}`, now);
        db.prepare(
          `INSERT INTO inspections (batch_id,inspector,appearance,firmness,ripeness,damage,temp_c,result,accepted_qty,rejected_qty,notes,created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          batch.id, parsed.data.inspector || 'Receiving Bay 1', 4, 4, 4, 2, null,
          line.rejectedQty > 0 ? 'partial' : 'pass', line.acceptedQty, line.rejectedQty, '', now,
        );
      }
      db.prepare('UPDATE po_items SET qty_received=qty_received+?, qty_accepted=qty_accepted+?, qty_rejected=qty_rejected+? WHERE id=?').run(
        arrived, line.acceptedQty, line.rejectedQty, item.id,
      );
    }
    const open = db.prepare('SELECT COUNT(*) AS n FROM po_items WHERE po_id=? AND qty_received < qty * 0.999').get(po.id).n;
    db.prepare('UPDATE purchase_orders SET status=?, received_at=? WHERE id=?').run(
      open === 0 ? 'completed' : 'receiving', open === 0 ? now : po.received_at, po.id,
    );
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return fail(e instanceof Error ? e.message : 'Receiving failed.');
  }
  refresh();
  revalidatePath(`/purchasing/${po.id}`);
  return { ok: true, message: 'Goods received and batches created' };
}

export async function refundSaleAction(id: number) {
  const sale = db.prepare('SELECT * FROM sales WHERE id=?').get(id);
  if (!sale) return fail('Sale not found.');
  if (sale.status === 'refunded') return fail('Sale is already refunded.');
  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id=?').all(id);
  const allocations = db.prepare('SELECT * FROM sale_allocations WHERE sale_id=?').all(id);
  db.exec('BEGIN');
  try {
    db.prepare("UPDATE sales SET status='refunded' WHERE id=?").run(id);
    for (const item of items) {
      const lines = allocations.filter((a: any) => a.sale_item_id === item.id);
      const qtyBack = lines.reduce((s: number, a: any) => s + a.qty, 0) || item.qty;
      for (const a of lines) {
        db.prepare("UPDATE batches SET qty_remaining=qty_remaining+?, status=CASE WHEN status='depleted' THEN 'available' ELSE status END WHERE id=?").run(a.qty, a.batch_id);
      }
      if (item.product_id) {
        db.prepare('UPDATE products SET stock_qty=stock_qty+? WHERE id=?').run(qtyBack, item.product_id);
        db.prepare("INSERT INTO inventory_log (product_id,change_qty,reason,note,created_at) VALUES (?,?,'refund',?,datetime('now'))").run(item.product_id, qtyBack, `Refund of sale #${id}`);
      }
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return fail(e instanceof Error ? e.message : 'Refund failed.');
  }
  refresh();
  revalidatePath(`/sales/${id}`);
  return { ok: true, message: `Sale #${id} refunded` } as ActionResult;
}

export async function batchAction(id: number, action: 'discount' | 'quarantine' | 'dispose', discountPct = 0) {
  const batch = db.prepare('SELECT * FROM batches WHERE id=?').get(id);
  if (!batch) return fail('Batch not found.');
  if (action === 'discount') {
    const pct = Math.min(Math.max(Math.round(Number(discountPct) || 0), 0), 90);
    db.prepare('UPDATE batches SET discount_pct=? WHERE id=?').run(pct, id);
  } else {
    db.prepare('UPDATE batches SET status=? WHERE id=?').run(action === 'quarantine' ? 'quarantined' : 'disposed', id);
  }
  refresh();
  revalidatePath(`/inventory/${id}`);
  return { ok: true, message: `Batch ${action} applied` } as ActionResult;
}

export async function batchFormAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      batchId: z.coerce.number().int().positive(),
      action: z.enum(['discount', 'quarantine', 'dispose']),
      discountPct: z.coerce.number().min(0).max(90).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Check the batch action.');
  return batchAction(parsed.data.batchId, parsed.data.action, parsed.data.discountPct ?? 0);
}

export async function recordWasteAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      productId: z.coerce.number().int().positive(),
      batchId: z.string().optional(),
      qty: z.coerce.number().positive(),
      reason: z.string().min(1).max(60),
      note: z.string().max(200).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Check the waste details.');
  const b = parsed.data;
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(b.productId);
  if (!product) return fail('Product not found.');
  if (b.batchId) {
    const available = db.prepare('SELECT qty_remaining FROM batches WHERE id=?').get(b.batchId)?.qty_remaining ?? 0;
    if (b.qty > available) return fail('Quantity exceeds batch balance.');
    db.prepare('UPDATE batches SET qty_remaining=qty_remaining-? WHERE id=?').run(b.qty, b.batchId);
  }
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE products SET stock_qty=MAX(0,stock_qty-?) WHERE id=?').run(b.qty, b.productId);
    db.prepare(
      `INSERT INTO waste (product_id,batch_id,supplier_id,qty,reason,value_cents,note,created_at)
       VALUES (?,?,?,?,?,?,?,datetime('now'))`,
    ).run(b.productId, b.batchId || null, product.supplier_id, b.qty, b.reason, Math.round(b.qty * product.cost_cents), b.note || '');
    db.prepare(
      "INSERT INTO inventory_log (product_id,change_qty,reason,note,created_at) VALUES (?,?,'waste',?,datetime('now'))",
    ).run(b.productId, -b.qty, b.reason);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return fail(e instanceof Error ? e.message : 'Could not record waste.');
  }
  refresh();
  return { ok: true, message: 'Waste recorded' };
}

export async function recordTemperatureAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({ zoneId: z.coerce.number().int().positive(), tempC: z.coerce.number().min(-40).max(80) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Enter a valid temperature.');
  const zone = db.prepare('SELECT * FROM zones WHERE id=?').get(parsed.data.zoneId);
  if (!zone) return fail('Zone not found.');
  const breach = (zone.min_temp != null && parsed.data.tempC < zone.min_temp) || (zone.max_temp != null && parsed.data.tempC > zone.max_temp);
  db.prepare('INSERT INTO temperature_readings (zone_id,temp_c,status,recorded_at) VALUES (?,?,?,datetime(\'now\'))').run(
    zone.id, parsed.data.tempC, breach ? 'breach' : 'ok',
  );
  revalidatePath('/cold-chain');
  revalidatePath('/');
  return { ok: true, message: breach ? 'Reading saved — BREACH detected' : 'Reading saved' };
}

export async function saveSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({ storeName: z.string().trim().min(1).max(60), taxRate: z.coerce.number().min(0).max(50) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail('Check the settings values.');
  setSetting('store_name', parsed.data.storeName);
  setSetting('tax_rate', parsed.data.taxRate);
  revalidatePath('/');
  return { ok: true, message: 'Settings saved' };
}
