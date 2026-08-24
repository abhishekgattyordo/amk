import { NextRequest } from 'next/server';
import { RFQService } from '../../../services/rfq.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { createRFQSchema, updateRFQSchema } from '../../../validations/rfq.schema';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_rfq:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View RFQs', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const rfq = await RFQService.getById(id);
      if (!rfq) return errorResponse('RFQ not found', 404);
      return successResponse(rfq);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { rfqs, total } = await RFQService.getAll({ search, status, page, limit });
    return paginatedResponse(rfqs, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_rfq:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create RFQs', 403);
    }

    const body = await req.json();
    const validated = createRFQSchema.parse(body);
    const rfq = await RFQService.create(validated);
    return successResponse(rfq, 'RFQ created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_rfq:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit RFQs', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('RFQ ID required', 400);

    const body = await req.json();
    const validated = updateRFQSchema.parse(body);
    const rfq = await RFQService.update(id, validated);
    return successResponse(rfq, 'RFQ updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_rfq:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete RFQs', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('RFQ ID required', 400);

    await RFQService.delete(id, user?.id, user?.name);
    return successResponse(null, 'RFQ deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
