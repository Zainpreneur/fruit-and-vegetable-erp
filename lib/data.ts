import { db, getSetting } from '@/lib/db';
import { lifeState, daysLeft } from '@/server/legacy/domain';

/**
 * Server-only read layer. All queries run directly against the same SQLite
 * database as the original GreenBasket API, so the Next.js UI and the legacy
 * /api routes always see identical data.
 */

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getSettings() {
  return {
    taxRate: Number(getSetting('tax_rate', '5')) || 0,
    storeName: String(getSetting('store_name', 'GreenBasket')),
  };
}

export function getDashboard() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sumBetween = (from: Date) =>
    db
      .prepare("SELECT COALESCE(SUM(total_cents),0) AS total, COUNT(*) AS orders FROM sales WHERE status='completed' AND created_at >= ?")
      .get(from.toISOString());

  const today = sumBetween(startOfToday);
  const month = sumBetween(startOfMonth);

  const chartStart = new Date(startOfToday);
  chartStart.setDate(chartStart.getDate() - 13);
  const recentSales = db
    .prepare("SELECT created_at AS createdAt, total_cents AS totalCents FROM sales WHERE status='completed' AND created_at >= ?")
    .all(chartStart.toISOString());
  const byDay: Record<string, number> = {};
  for (const s of recentSales) byDay[dayKey(s.createdAt)] = (byDay[dayKey(s.createdAt)] || 0) + s.totalCents;
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - 13 + i);
    return {
      date: dayKey(d.toISOString()),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenueCents: byDay[dayKey(d.toISOString())] || 0,
    };
  });

  const lowStock = db
    .prepare(
      `SELECT id, name, emoji, stock_qty AS stockQty, reorder_level AS reorderLevel, unit
       FROM products WHERE active = 1 AND stock_qty <= reorder_level
       ORDER BY CASE WHEN stock_qty <= 0 THEN 0 ELSE 1 END, stock_qty LIMIT 8`,
    )
    .all();
  const lowStockCount = db
    .prepare('SELECT COUNT(*) AS c FROM products WHERE active = 1 AND stock_qty <= reorder_level')
    .get().c;

  const recentOrders = db
    .prepare(
      `SELECT s.id, s.total_cents AS totalCents, s.status, s.payment_method AS paymentMethod,
              s.created_at AS createdAt, c.name AS customerName,
              (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS itemCount
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       ORDER BY s.created_at DESC, s.id DESC LIMIT 8`,
    )
    .all();

  const stockValue = db
    .prepare("SELECT COALESCE(SUM(qty_remaining * unit_cost_cents),0) AS v FROM batches WHERE status IN ('available','quarantined')")
    .get().v;
  const expSoon = db
    .prepare(
      "SELECT COUNT(*) AS n, COALESCE(SUM(qty_remaining * unit_cost_cents),0) AS v FROM batches WHERE status = 'available' AND expiry_date <= datetime('now', '+3 days')",
    )
    .get();
  const waste7 = db
    .prepare("SELECT COALESCE(SUM(value_cents),0) AS v FROM waste WHERE created_at >= datetime('now','-7 days')")
    .get().v;
  const breaches = db
    .prepare(
      `SELECT COUNT(*) AS n FROM zones z WHERE z.min_temp IS NOT NULL AND (
         (SELECT temp_c FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) < z.min_temp OR
         (SELECT temp_c FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) > z.max_temp)`,
    )
    .get().n;
  const openPOs = db.prepare("SELECT COUNT(*) AS n FROM purchase_orders WHERE status IN ('draft','ordered','receiving')").get().n;

  const urgentBatches = db
    .prepare(
      `SELECT b.id, b.code, b.qty_remaining AS qtyRemaining, b.expiry_date AS expiryDate,
              p.name AS productName, p.emoji, p.unit
       FROM batches b JOIN products p ON p.id = b.product_id
       WHERE b.status = 'available' AND b.expiry_date <= datetime('now','+3 days')
       ORDER BY b.expiry_date ASC LIMIT 6`,
    )
    .all();

  return {
    todayRevenueCents: today.total,
    todayOrders: today.orders,
    monthRevenueCents: month.total,
    monthOrders: month.orders,
    avgOrderCents: month.orders ? Math.round(month.total / month.orders) : 0,
    productCount: db.prepare('SELECT COUNT(*) AS c FROM products WHERE active=1').get().c,
    customerCount: db.prepare('SELECT COUNT(*) AS c FROM customers').get().c,
    lowStockCount,
    lowStock,
    series,
    recentOrders,
    stockValueCents: stockValue,
    expiringSoonCount: expSoon.n,
    expiringSoonValueCents: expSoon.v,
    waste7dValueCents: waste7,
    coldChainBreaches: breaches,
    openPOs,
    urgentBatches,
  };
}

export function getExecutiveBrief() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = db
    .prepare("SELECT COALESCE(SUM(total_cents),0) AS v, COUNT(*) AS n FROM sales WHERE status='completed' AND created_at >= ?")
    .get(startOfToday.toISOString());
  const weekAvg = db
    .prepare(
      `SELECT AVG(daily) AS v FROM (
         SELECT date(created_at) AS d, SUM(total_cents) AS daily FROM sales
         WHERE status='completed' AND created_at >= datetime('now','-7 days') GROUP BY d)`,
    )
    .get().v;
  const lowStock = db
    .prepare(
      'SELECT name, emoji, stock_qty AS stockQty, reorder_level AS reorderLevel, unit FROM products WHERE active=1 AND stock_qty <= reorder_level ORDER BY stock_qty LIMIT 5',
    )
    .all();
  const wasteTop = db
    .prepare(
      `SELECT p.name, SUM(w.value_cents) AS v FROM waste w JOIN products p ON p.id=w.product_id
       WHERE w.created_at >= datetime('now','-7 days') GROUP BY w.product_id ORDER BY v DESC LIMIT 1`,
    )
    .get();
  const breachZones = db
    .prepare(
      `SELECT z.name, z.min_temp, z.max_temp,
         (SELECT temp_c FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) AS lastTemp
       FROM zones z WHERE z.min_temp IS NOT NULL AND (
         (SELECT temp_c FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) > z.max_temp OR
         (SELECT temp_c FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) < z.min_temp)`,
    )
    .all();

  const actions: string[] = [];
  if (lowStock.length) actions.push(`Reorder ${lowStock.length} item(s) at or below reorder level.`);
  if (breachZones.length)
    actions.push(`Cold-chain breach in ${breachZones.map((b: any) => b.name).join(', ')} — inspect immediately.`);
  if (wasteTop?.v > 0)
    actions.push(`${wasteTop.name} generated the most waste this week (${(wasteTop.v / 100).toFixed(2)}) — review purchase frequency.`);

  return {
    todayRevenueCents: today.v,
    todayOrders: today.n,
    weekAvgDailyCents: weekAvg ? Math.round(weekAvg) : 0,
    lowStock,
    coldChainBreaches: breachZones,
    recommendedActions: actions,
  };
}

const PRODUCT_SELECT = `
  SELECT p.id, p.sku, p.name, p.emoji, p.unit,
         p.cost_cents AS costCents, p.price_cents AS priceCents,
         p.wholesale_price_cents AS wholesalePriceCents,
         p.stock_qty AS stockQty, p.reorder_level AS reorderLevel,
         p.active, p.category_id AS categoryId, p.supplier_id AS supplierId,
         p.variety, p.origin, p.shelf_life_days AS shelfLifeDays, p.storage_req AS storageReq,
         c.name AS category, c.emoji AS categoryEmoji, s.name AS supplier
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id`;

export function getProducts(options: { q?: string; categoryId?: number; lowStock?: boolean; active?: boolean } = {}) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (options.q) {
    where.push('(p.name LIKE ? OR p.sku LIKE ?)');
    args.push(`%${options.q}%`, `%${options.q}%`);
  }
  if (options.categoryId) {
    where.push('p.category_id = ?');
    args.push(options.categoryId);
  }
  if (options.lowStock) where.push('p.stock_qty <= p.reorder_level');
  if (options.active !== undefined) {
    where.push('p.active = ?');
    args.push(options.active ? 1 : 0);
  } else {
    where.push('p.active = 1');
  }
  return db
    .prepare(
      `${PRODUCT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.name, p.name`,
    )
    .all(...args);
}

export function getProduct(id: number) {
  return db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id) ?? null;
}

export function getCategories() {
  return db
    .prepare(
      `SELECT c.id, c.name, c.emoji, COUNT(p.id) AS productCount
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
       GROUP BY c.id ORDER BY c.name`,
    )
    .all();
}

export function getSuppliers() {
  return db.prepare('SELECT * FROM suppliers ORDER BY name').all();
}

export function getCustomers() {
  return db.prepare('SELECT * FROM customers ORDER BY name').all();
}

export function getBatches(options: { state?: string; q?: string } = {}) {
  const rows = db
    .prepare(
      `SELECT b.*, p.name AS productName, p.emoji, p.unit, p.sku,
              s.name AS supplierName, z.name AS zoneName,
              (SELECT COUNT(*) FROM inspections i WHERE i.batch_id=b.id) AS inspectionCount
       FROM batches b
       JOIN products p ON p.id = b.product_id
       LEFT JOIN suppliers s ON s.id = b.supplier_id
       LEFT JOIN zones z ON z.id = b.storage_zone_id
       ORDER BY b.expiry_date ASC, b.id DESC`,
    )
    .all();
  const enriched = rows.map((b: any) => ({
    ...b,
    life: lifeState(b),
    daysLeft: daysLeft(b),
  }));
  if (options.state) return enriched.filter((b: any) => b.life === options.state);
  if (options.q) {
    const q = options.q.toLowerCase();
    return enriched.filter(
      (b: any) =>
        String(b.code).toLowerCase().includes(q) ||
        String(b.productName).toLowerCase().includes(q) ||
        String(b.supplierName || '').toLowerCase().includes(q),
    );
  }
  return enriched;
}

export function getBatch(id: number) {
  const b: any = db
    .prepare(
      `SELECT b.*, p.name AS productName, p.emoji, p.unit, s.name AS supplierName, z.name AS zoneName
       FROM batches b JOIN products p ON p.id=b.product_id
       LEFT JOIN suppliers s ON s.id=b.supplier_id LEFT JOIN zones z ON z.id=b.storage_zone_id
       WHERE b.id = ?`,
    )
    .get(id);
  if (!b) return null;
  const inspections = db.prepare('SELECT * FROM inspections WHERE batch_id = ? ORDER BY id DESC').all(id);
  const allocations = db
    .prepare('SELECT sa.*, s.code AS saleCode FROM sale_allocations sa JOIN sales s ON s.id=sa.sale_id WHERE sa.batch_id = ? ORDER BY sa.id DESC')
    .all(id);
  return { ...b, life: lifeState(b), daysLeft: daysLeft(b), inspections, allocations };
}

export function getZones() {
  return db
    .prepare(
      `SELECT z.*,
         (SELECT temp_c FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) AS lastTemp,
         (SELECT recorded_at FROM temperature_readings r WHERE r.zone_id=z.id ORDER BY recorded_at DESC LIMIT 1) AS lastReadingAt,
         (SELECT COUNT(*) FROM temperature_readings r WHERE r.zone_id=z.id AND (r.temp_c < z.min_temp OR r.temp_c > z.max_temp)) AS breachCount
       FROM zones z ORDER BY z.name`,
    )
    .all();
}

export function getTemperatureReadings(limit = 15) {
  return db
    .prepare(
      `SELECT r.*, z.name AS zoneName FROM temperature_readings r JOIN zones z ON z.id=r.zone_id
       ORDER BY r.recorded_at DESC LIMIT ?`,
    )
    .all(limit);
}

export function getWaste(options: { days?: number } = {}) {
  const days = options.days ?? 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const events = db
    .prepare(
      `SELECT w.*, p.name AS productName, p.emoji, b.code AS batchCode
       FROM waste w JOIN products p ON p.id=w.product_id LEFT JOIN batches b ON b.id=w.batch_id
       WHERE w.created_at >= ? ORDER BY w.created_at DESC LIMIT 100`,
    )
    .all(since);
  const byReason = db
    .prepare(
      `SELECT reason, COUNT(*) AS events, SUM(qty) AS qty, SUM(value_cents) AS valueCents
       FROM waste WHERE created_at >= ? GROUP BY reason ORDER BY valueCents DESC`,
    )
    .all(since);
  const byProduct = db
    .prepare(
      `SELECT p.name, p.emoji, SUM(w.qty) AS qty, SUM(w.value_cents) AS valueCents
       FROM waste w JOIN products p ON p.id=w.product_id WHERE w.created_at >= ?
       GROUP BY p.id ORDER BY valueCents DESC LIMIT 8`,
    )
    .all(since);
  return { events, byReason, byProduct };
}

export function getSales(options: { limit?: number; channel?: string; status?: string } = {}) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (options.channel) {
    where.push('s.channel = ?');
    args.push(options.channel);
  }
  if (options.status) {
    where.push('s.status = ?');
    args.push(options.status);
  }
  return db
    .prepare(
      `SELECT s.id, s.total_cents AS totalCents, s.subtotal_cents AS subtotalCents,
              s.discount_pct AS discountPct, s.tax_cents AS taxCents,
              s.payment_method AS paymentMethod, s.status, s.channel, s.due_date AS dueDate,
              s.created_at AS createdAt, c.name AS customerName,
              (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS itemCount
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY s.created_at DESC, s.id DESC LIMIT ?`,
    )
    .all(...args, Math.min(options.limit ?? 50, 500));
}

export function getSale(id: number) {
  return db
    .prepare(
      `SELECT s.*, c.name AS customerName, c.segment AS customerSegment,
         (SELECT COALESCE(SUM(qty * cost_cents),0) FROM sale_items WHERE sale_id = s.id) AS cogsCents
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = ?`,
    )
    .get(id) ?? null;
}

export function getSaleDetails(id: number) {
  const items = db
    .prepare(
      `SELECT si.id, si.product_id AS productId, si.product_name AS productName, si.qty,
              si.unit_label AS unitLabel, si.unit_price_cents AS unitPriceCents,
              si.cost_cents AS costCents, si.line_total_cents AS lineTotalCents
       FROM sale_items si WHERE si.sale_id = ? ORDER BY si.id`,
    )
    .all(id);
  const allocations = db
    .prepare(
      `SELECT sa.sale_item_id AS saleItemId, sa.batch_id AS batchId, sa.qty, sa.unit_price_cents AS unitPriceCents,
              b.code AS batchCode, b.grade, b.expiry_date AS expiryDate, p.name AS productName, s.name AS supplierName
       FROM sale_allocations sa JOIN batches b ON b.id = sa.batch_id
       JOIN products p ON p.id = b.product_id LEFT JOIN suppliers s ON s.id = b.supplier_id
       WHERE sa.sale_id = ? ORDER BY sa.id`,
    )
    .all(id);
  const paid = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS v FROM payments WHERE sale_id = ?').get(id).v;
  return { items, allocations, paidCents: paid };
}

export function getPurchaseOrders() {
  return db
    .prepare(
      `SELECT po.*, s.name AS supplierName,
         (SELECT COUNT(*) FROM po_items i WHERE i.po_id=po.id) AS itemCount,
         (SELECT COALESCE(SUM(qty_accepted * unit_cost_cents),0) FROM po_items i WHERE i.po_id=po.id) AS receivedValueCents
       FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id
       ORDER BY po.created_at DESC, po.id DESC LIMIT 100`,
    )
    .all();
}

export function getPurchaseOrder(id: number) {
  const po = db
    .prepare('SELECT po.*, s.name AS supplierName FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id WHERE po.id=?')
    .get(id) ?? null;
  if (!po) return null;
  const items = db
    .prepare(
      `SELECT i.*, p.name AS productName, p.emoji, p.unit FROM po_items i JOIN products p ON p.id=i.product_id WHERE i.po_id=? ORDER BY i.id`,
    )
    .all(id);
  return { ...po, items };
}

export function getSubscriptions() {
  return db
    .prepare(
      `SELECT su.*, c.name AS customerName, c.phone,
         (SELECT COUNT(*) FROM json_each(su.items_json)) AS itemCount
       FROM subscriptions su JOIN customers c ON c.id=su.customer_id ORDER BY su.next_run`,
    )
    .all();
}

export function getReceivables() {
  return db
    .prepare(
      `SELECT s.id, s.total_cents AS totalCents, s.due_date AS dueDate, s.created_at AS createdAt,
              c.name AS customerName, c.segment,
              (SELECT COALESCE(SUM(amount_cents),0) FROM payments p WHERE p.sale_id=s.id) AS paidCents
       FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
       WHERE s.status='completed' AND s.channel IN ('b2b','subscription')
       ORDER BY s.due_date`,
    )
    .all();
}

export function getKpis(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const sales = db
    .prepare("SELECT COALESCE(SUM(total_cents),0) AS revenueCents, COUNT(*) AS orders FROM sales WHERE status='completed' AND created_at >= ?")
    .get(since);
  const byChannel = db
    .prepare('SELECT channel, SUM(total_cents) AS revenueCents, COUNT(*) AS orders FROM sales WHERE status=\'completed\' AND created_at >= ? GROUP BY channel')
    .all(since);
  const profitRow = db
    .prepare(
      `SELECT CAST(ROUND(COALESCE(SUM(si.line_total_cents - si.qty * si.cost_cents),0)) AS INTEGER) AS v
       FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE s.status='completed' AND s.created_at >= ?`,
    )
    .get(since).v;
  const wasteAgg = db
    .prepare('SELECT COALESCE(SUM(value_cents),0) AS v, COALESCE(SUM(qty),0) AS q, COUNT(*) AS events FROM waste WHERE created_at >= ?')
    .get(since);
  const topProducts = db
    .prepare(
      `SELECT si.product_name AS productName, MAX(p.emoji) AS emoji, SUM(si.qty) AS qtySold,
              SUM(si.line_total_cents) AS revenueCents,
              CAST(ROUND(SUM(si.line_total_cents - si.qty * si.cost_cents)) AS INTEGER) AS profitCents
       FROM sale_items si JOIN sales s ON s.id=si.sale_id LEFT JOIN products p ON p.id=si.product_id
       WHERE s.status='completed' AND s.created_at >= ? GROUP BY si.product_name ORDER BY revenueCents DESC LIMIT 10`,
    )
    .all(since);
  const byCategory = db
    .prepare(
      `SELECT COALESCE(c.name,'Other') AS category, COALESCE(MAX(c.emoji),'') AS emoji,
              SUM(si.line_total_cents) AS revenueCents
       FROM sale_items si JOIN sales s ON s.id=si.sale_id
       LEFT JOIN products p ON p.id=si.product_id LEFT JOIN categories c ON c.id=p.category_id
       WHERE s.status='completed' AND s.created_at >= ? GROUP BY c.name ORDER BY revenueCents DESC`,
    )
    .all(since);
  return {
    days,
    revenueCents: sales.revenueCents,
    orders: sales.orders,
    grossProfitCents: profitRow,
    marginPct: sales.revenueCents ? Math.round((profitRow / sales.revenueCents) * 1000) / 10 : 0,
    byChannel,
    wasteValueCents: wasteAgg.v,
    wasteEvents: wasteAgg.events,
    topProducts,
    byCategory,
  };
}

export function getProcurementSuggestions() {
  const rows = db.prepare('SELECT * FROM products WHERE active=1 ORDER BY (stock_qty - reorder_level) ASC').all();
  const suggestions: any[] = [];
  for (const p of rows) {
    const subDemand = db
      .prepare(
        `SELECT COALESCE(SUM(json_extract(j.value,'$.qty')),0) AS q FROM subscriptions su, json_each(su.items_json) j
         WHERE su.active=1 AND CAST(json_extract(j.value,'$.productId') AS INTEGER)=?
           AND su.next_run <= date('now','+' || ? || ' days')`,
      )
      .get(p.id, Math.min(p.shelf_life_days || 7, 14)).q;
    if (p.reorder_level <= 0 || p.stock_qty + subDemand >= p.reorder_level * 1.5) continue;
    suggestions.push({
      ...p,
      subscriptionDemand: subDemand,
      suggestQty: Math.max(Math.ceil((p.reorder_level * 2 - p.stock_qty - subDemand) * 10) / 10, 1),
      reason: subDemand > 0 ? `Low stock plus ${subDemand} ${p.unit} subscribed demand` : 'Below reorder threshold',
    });
  }
  return suggestions;
}

export function getPerishabilityRecommendations() {
  const rows = db
    .prepare(
      `SELECT b.*, p.name AS productName, p.emoji, p.unit FROM batches b JOIN products p ON p.id=b.product_id
       WHERE b.status='available' AND b.expiry_date <= datetime('now','+4 days') ORDER BY b.expiry_date ASC`,
    )
    .all();
  return rows.map((b: any) => {
    const state = lifeState(b);
    const dl = daysLeft(b);
    let action = 'bundle';
    let suggestedDiscountPct = 0;
    if (state === 'expired') action = 'dispose';
    else if (dl <= 1) {
      action = 'discount';
      suggestedDiscountPct = 50;
    } else if (dl <= 2) {
      action = 'discount';
      suggestedDiscountPct = 35;
    } else if (state === 'urgent') {
      action = 'discount';
      suggestedDiscountPct = 25;
    }
    return {
      ...b,
      life: state,
      action,
      suggestedDiscountPct,
      valueCents: Math.round(b.qty_remaining * b.unit_cost_cents),
    };
  });
}

export function getInventoryLog(limit = 25) {
  return db
    .prepare(
      `SELECT l.*, p.name AS productName, p.emoji FROM inventory_log l JOIN products p ON p.id=l.product_id
       ORDER BY l.id DESC LIMIT ?`,
    )
    .all(limit);
}
