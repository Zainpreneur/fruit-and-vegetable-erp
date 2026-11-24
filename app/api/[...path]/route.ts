import { NextRequest, NextResponse } from 'next/server';
import { createRouter } from '@/server/legacy/router';
import { registerCatalogRoutes } from '@/server/legacy/routes/catalog';
import { registerPeopleRoutes } from '@/server/legacy/routes/people';
import { registerSalesRoutes } from '@/server/legacy/routes/sales';
import { registerInventoryRoutes } from '@/server/legacy/routes/inventory';
import { registerReportRoutes } from '@/server/legacy/routes/reports';
import { registerOperationsRoutes } from '@/server/legacy/routes/operations';
import { registerPurchasingRoutes } from '@/server/legacy/routes/purchasing';
import { registerBillingRoutes } from '@/server/legacy/routes/billing';
import { registerIntelligenceRoutes } from '@/server/legacy/routes/intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const router = createRouter();
registerCatalogRoutes(router);
registerPeopleRoutes(router);
registerSalesRoutes(router);
registerInventoryRoutes(router);
registerReportRoutes(router);
registerOperationsRoutes(router);
registerPurchasingRoutes(router);
registerBillingRoutes(router);
registerIntelligenceRoutes(router);

/**
 * Bridge the original Node http req/res based API into Next.js route handlers.
 * Keeps all 61 GreenBasket endpoints available while the UI moves to App Router.
 */
async function handle(request: NextRequest) {
  const url = new URL(request.url);
  const body = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();

  const reqShim = {
    method: request.method,
    on(event: string, cb: (...args: unknown[]) => void) {
      if (event === 'data') {
        if (body) queueMicrotask(() => cb(Buffer.from(body)));
      } else if (event === 'end') queueMicrotask(() => cb());
      return this;
    },
    destroy() {},
  };

  let status = 200;
  const headers: Record<string, string> = {};
  let output = '';
  const resShim = {
    headersSent: false,
    writeHead(code: number, h: Record<string, string> = {}) {
      status = code;
      Object.assign(headers, h);
      return this;
    },
    end(chunk?: unknown) {
      output = chunk == null ? '' : String(chunk);
    },
  };

  const handled = await router.handle(reqShim, resShim, url);
  if (!handled) return NextResponse.json({ error: 'API endpoint not found' }, { status: 404 });

  return new NextResponse(output, {
    status,
    headers: { 'Content-Type': headers['Content-Type'] || 'application/json; charset=utf-8', ...headers },
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
