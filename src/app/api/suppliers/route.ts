import { NextRequest } from 'next/server';
import { SupplierService } from '../../../services/supplier.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { createSupplierSchema, updateSupplierSchema } from '../../../validations/supplier.schema';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_suppliers:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Suppliers', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const supplier = await SupplierService.getById(id);
      if (!supplier) return errorResponse('Supplier not found', 404);
      return successResponse(supplier);
    }

    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { suppliers, total } = await SupplierService.getAll({ search, page, limit });
    return paginatedResponse(suppliers, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_suppliers:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Suppliers', 403);
    }

    const body = await req.json();
    console.log('SUPPLIER CREATE API CALLED');
    console.log('Request payload:', JSON.stringify(body, null, 2));
    const validated = createSupplierSchema.parse(body);
    const supplier = await SupplierService.create(validated);
    console.log('Supplier created:', JSON.stringify(supplier, null, 2));
    return successResponse(supplier, 'Supplier created successfully', 201);
  } catch (err: any) {
    console.error('Error in SUPPLIER API:', err);
    return errorResponse(err.message || err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_suppliers:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Suppliers', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Supplier ID required', 400);

    const body = await req.json();
    const validated = updateSupplierSchema.parse(body);
    const supplier = await SupplierService.update(id, validated);
    return successResponse(supplier, 'Supplier updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_suppliers:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Suppliers', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Supplier ID required', 400);

    await SupplierService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Supplier deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
