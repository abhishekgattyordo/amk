import { NextRequest } from 'next/server';
import { ProductService } from '../../../services/product.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { createProductSchema, updateProductSchema } from '../../../validations/product.schema';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_products:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Products', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const product = await ProductService.getById(id);
      if (!product) return errorResponse('Product not found', 404);
      return successResponse(product);
    }

    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { products, total } = await ProductService.getAll({ search, category, warehouseId, page, limit });
    return paginatedResponse(products, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_products:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Products', 403);
    }

    const body = await req.json();
    const validated = createProductSchema.parse(body);
    const product = await ProductService.create(validated, user?.id, user?.name);
    return successResponse(product, 'Product created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_products:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Products', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Product ID required', 400);

    const body = await req.json();
    const validated = updateProductSchema.parse(body);
    const product = await ProductService.update(id, validated, user?.id, user?.name);
    return successResponse(product, 'Product updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_products:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Products', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Product ID required', 400);

    await ProductService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Product deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
