import { NextRequest } from 'next/server';
import { CategoryService } from '../../../services/category.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { createCategorySchema, updateCategorySchema } from '../../../validations/category.schema';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_categories:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Categories', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const category = await CategoryService.getById(id);
      if (!category) return errorResponse('Category not found', 404);
      return successResponse(category);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { categories, total } = await CategoryService.getAll({ search, status, page, limit });
    return paginatedResponse(categories, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_categories:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Categories', 403);
    }

    const body = await req.json();
    console.log('CATEGORY API CALLED', body);
    const validated = createCategorySchema.parse(body);
    const category = await CategoryService.create(validated);
    return successResponse(category, 'Category created successfully', 201);
  } catch (err: any) {
    console.error('Error in CATEGORY API:', err);
    return errorResponse(err.message || err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_categories:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Categories', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Category ID required', 400);

    const body = await req.json();
    const validated = updateCategorySchema.parse(body);
    const category = await CategoryService.update(id, validated);
    return successResponse(category, 'Category updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_categories:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Categories', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Category ID required', 400);

    await CategoryService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Category deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
