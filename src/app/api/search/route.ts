import { NextRequest } from 'next/server';
import { SEARCH_MODULES } from '../../../config/searchRegistry';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';
import { successResponse, errorResponse } from '../../../utils/api';
import { RawMaterialService } from '../../../services/raw-material.service';
import { ProductService } from '../../../services/product.service';
import { SupplierService } from '../../../services/supplier.service';
import { CategoryService } from '../../../services/category.service';
import { SubcategoryService } from '../../../services/subcategory.service';
import { WarehouseService } from '../../../services/warehouse.service';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { RFQService } from '../../../services/rfq.service';
import { StockMovementService } from '../../../services/stock-movement.service';
import { GateEntryService } from '../../../services/gate-entry.service';
import { QualityCheckService } from '../../../services/quality-check.service';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const { searchParams } = req.nextUrl;
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return successResponse({ results: [] });
    }

    const queryLower = q.toLowerCase();
    const allResults: any[] = [];

    // Helper to fetch data per module based on registry config
    const fetchModuleData = async (mod: typeof SEARCH_MODULES[0]) => {
      // Check permissions if user is present
      if (user && mod.permission) {
        const canView = hasApiPermission(user, mod.permission) || hasApiPermission(user, 'all:read');
        if (!canView) return [];
      }

      try {
        let items: any[] = [];
        switch (mod.key) {
          case 'raw-materials': {
            const res = await RawMaterialService.getAll({ search: q, limit: 15 });
            items = res.materials || [];
            break;
          }
          case 'products': {
            const res = await ProductService.getAll({ search: q, limit: 15 });
            items = res.products || [];
            break;
          }
          case 'suppliers': {
            const res = await SupplierService.getAll({ search: q, limit: 15 });
            items = res.suppliers || [];
            break;
          }
          case 'categories': {
            const res = await CategoryService.getAll({ search: q, limit: 15 });
            items = res.categories || [];
            break;
          }
          case 'subcategories': {
            const res = await SubcategoryService.getAll({ search: q, limit: 15 });
            items = res.subcategories || [];
            break;
          }
          case 'warehouses': {
            const res = await WarehouseService.getAll({ search: q, limit: 15 });
            items = res.warehouses || [];
            break;
          }
          case 'purchase-orders': {
            const res = await PurchaseOrderService.getAll({ search: q, limit: 15 });
            items = res.pos || [];
            break;
          }
          case 'rfqs': {
            const res = await RFQService.getAll({ search: q, limit: 15 });
            items = res.rfqs || [];
            break;
          }
          case 'stock-movements': {
            const res = await StockMovementService.getAll({ search: q, limit: 15 });
            items = res.transactions || [];
            break;
          }
          case 'gate-entries': {
            const res = await GateEntryService.getAll({ search: q, limit: 15 });
            items = res.entries || [];
            break;
          }
          case 'quality-checks': {
            const res = await QualityCheckService.getAll({ search: q, limit: 15 });
            items = res.checks || [];
            break;
          }
          case 'users': {
            items = await prisma.user.findMany({
              where: {
                deletedAt: null,
                isDeleted: false,
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { department: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 15,
              include: { role: true },
            }).catch(() => []);
            break;
          }
          default:
            items = [];
        }

        return items.map((item: any) => {
          const codeVal = item[mod.codeField] || item.code || item.poNumber || item.rfqNumber || item.transactionNumber || item.entryNumber || item.qcNumber || item.email || item.id || '';
          const nameVal = item[mod.nameField] || item.name || item.supplierName || item.description || 'Record';
          const subtitleVal = mod.subtitleBuilder ? mod.subtitleBuilder(item) : '';

          // Calculate relevance score for sorting (exact code match = highest)
          let relevance = 1;
          const cleanCode = String(codeVal).toLowerCase().replace(/[-_]/g, '');
          const cleanQuery = queryLower.replace(/[-_]/g, '');

          if (cleanCode === cleanQuery || String(codeVal).toLowerCase() === queryLower) {
            relevance = 100;
          } else if (String(codeVal).toLowerCase().includes(queryLower)) {
            relevance = 50;
          } else if (String(nameVal).toLowerCase().includes(queryLower)) {
            relevance = 25;
          }

          return {
            module: mod.key,
            moduleLabel: mod.label,
            id: item.id,
            code: codeVal,
            name: nameVal,
            subtitle: subtitleVal,
            route: mod.route,
            iconName: mod.iconName,
            relevance,
          };
        });
      } catch (err) {
        console.error(`Error searching module ${mod.key}:`, err);
        return [];
      }
    };

    // Execute searches across all configured modules in parallel
    const searchPromises = SEARCH_MODULES.map(mod => fetchModuleData(mod));
    const nestedResults = await Promise.all(searchPromises);

    for (const resList of nestedResults) {
      allResults.push(...resList);
    }

    // Sort results by relevance descending
    allResults.sort((a, b) => b.relevance - a.relevance);

    return successResponse({ results: allResults });
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
