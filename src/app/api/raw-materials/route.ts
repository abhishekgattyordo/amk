import { NextRequest } from 'next/server';
import { RawMaterialService } from '../../../services/raw-material.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Raw Materials', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const material = await RawMaterialService.getById(id);
      if (!material) return errorResponse('Raw Material not found', 404);
      return successResponse(material);
    }

    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { materials, total } = await RawMaterialService.getAll({
      search,
      categoryId,
      supplierId,
      warehouseId,
      page,
      limit,
    });
    return paginatedResponse(materials, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Raw Materials', 403);
    }

    const body = await req.json();
    if (!body.supplierId) return errorResponse('Supplier ID is required', 400);
    if (!body.warehouseId) return errorResponse('Warehouse ID is required', 400);
    const material = await RawMaterialService.create(body, user?.id, user?.name);
    return successResponse(material, 'Raw Material created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Raw Materials', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Raw Material ID required', 400);

    const body = await req.json();
    const material = await RawMaterialService.update(id, body, user?.id, user?.name);
    return successResponse(material, 'Raw Material updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Raw Materials', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Raw Material ID required', 400);

    await RawMaterialService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Raw Material deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
