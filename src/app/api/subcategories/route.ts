import { NextRequest } from 'next/server';
import { SubcategoryService } from '../../../services/subcategory.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { createSubcategorySchema, updateSubcategorySchema } from '../../../validations/category.schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const subcategory = await SubcategoryService.getById(id);
      if (!subcategory) return errorResponse('Subcategory not found', 404);
      return successResponse(subcategory);
    }

    const categoryId = searchParams.get('categoryId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { subcategories, total } = await SubcategoryService.getAll({ categoryId, search, page, limit });
    return paginatedResponse(subcategories, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createSubcategorySchema.parse(body);
    const subcategory = await SubcategoryService.create(validated);
    return successResponse(subcategory, 'Subcategory created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Subcategory ID required', 400);

    const body = await req.json();
    const validated = updateSubcategorySchema.parse(body);
    const subcategory = await SubcategoryService.update(id, validated);
    return successResponse(subcategory, 'Subcategory updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = null;

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Subcategory ID required', 400);

    await SubcategoryService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Subcategory deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
