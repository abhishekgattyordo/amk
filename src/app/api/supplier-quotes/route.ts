import { NextRequest } from 'next/server';
import { SupplierQuoteService } from '../../../services/supplier-quote.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_quotes:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Supplier Quotes', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const quote = await SupplierQuoteService.getById(id);
      if (!quote) return errorResponse('Supplier Quote not found', 404);
      return successResponse(quote);
    }

    const rfqId = searchParams.get('rfqId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { quotes, total } = await SupplierQuoteService.getAll({ rfqId, supplierId, search, page, limit });
    return paginatedResponse(quotes, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_quotes:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Supplier Quotes', 403);
    }

    const body = await req.json();
    const quote = await SupplierQuoteService.create(body);
    return successResponse(quote, 'Supplier Quote created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_quotes:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Supplier Quotes', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Supplier Quote ID required', 400);

    const body = await req.json();
    const quote = await SupplierQuoteService.update(id, body);
    return successResponse(quote, 'Supplier Quote updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_quotes:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Supplier Quotes', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Supplier Quote ID required', 400);

    await SupplierQuoteService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Supplier Quote deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
