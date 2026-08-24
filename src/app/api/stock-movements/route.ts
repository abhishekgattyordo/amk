import { NextRequest } from 'next/server';
import { StockMovementService } from '../../../services/stock-movement.service';
import { InventoryService } from '../../../services/inventory.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { stockInSchema, stockOutSchema, warehouseTransferSchema, stockAdjustmentSchema } from '../../../validations/inventory.schema';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_transactions:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Stock Movements', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const txn = await StockMovementService.getById(id);
      if (!txn) return errorResponse('Transaction not found', 404);
      return successResponse(txn);
    }

    const search = searchParams.get('search') || undefined;
    const transactionType = searchParams.get('transactionType') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const materialId = searchParams.get('materialId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { transactions, total } = await StockMovementService.getAll({
      search,
      transactionType,
      warehouseId,
      materialId,
      page,
      limit,
    });
    return paginatedResponse(transactions, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_transactions:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Stock Movements', 403);
    }

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action') || 'in';
    const body = await req.json();

    if (action === 'in') {
      const validated = stockInSchema.parse(body);
      const result = await InventoryService.stockIn(validated);
      return successResponse(result, 'Stock received successfully', 201);
    } else if (action === 'out') {
      const validated = stockOutSchema.parse(body);
      const result = await InventoryService.stockOut(validated);
      return successResponse(result, 'Stock issued successfully', 201);
    } else if (action === 'transfer') {
      const validated = warehouseTransferSchema.parse(body);
      const result = await InventoryService.warehouseTransfer(validated);
      return successResponse(result, 'Stock transferred successfully', 201);
    } else if (action === 'adjustment') {
      const validated = stockAdjustmentSchema.parse(body);
      const result = await InventoryService.stockAdjustment(validated);
      return successResponse(result, 'Stock adjusted successfully', 201);
    } else {
      return errorResponse('Invalid movement action. Supported: in, out, transfer, adjustment', 400);
    }
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_transactions:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Stock Movements', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Transaction ID is required', 400);
    }

    const deleted = await StockMovementService.delete(id);
    return successResponse(deleted, 'Stock movement deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
