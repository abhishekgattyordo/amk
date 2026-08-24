import { NextRequest } from 'next/server';
import { WarehouseService } from '../../../services/warehouse.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    // Allow viewing warehouses for authenticated ERP users
    if (user && !hasApiPermission(user, 'inventory_warehouses:view') && !hasApiPermission(user, 'procurement:read') && !hasApiPermission(user, 'inventory:read')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Warehouses', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const warehouse = await WarehouseService.getById(id);
      if (!warehouse) return errorResponse('Warehouse not found', 404);
      return successResponse(warehouse);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { warehouses, total } = await WarehouseService.getAll({ search, status, page, limit });
    return paginatedResponse(warehouses, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_warehouses:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Warehouses', 403);
    }

    const body = await req.json();
    const warehouse = await WarehouseService.create(body);
    return successResponse(warehouse, 'Warehouse created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_warehouses:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Warehouses', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Warehouse ID required', 400);

    const body = await req.json();
    const warehouse = await WarehouseService.update(id, body);
    return successResponse(warehouse, 'Warehouse updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_warehouses:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Warehouses', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Warehouse ID required', 400);

    await WarehouseService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Warehouse deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
