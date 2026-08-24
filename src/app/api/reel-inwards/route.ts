import { NextRequest } from 'next/server';
import { ReelInwardService } from '../../../services/reel-inward.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Reel Inwards', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const reel = await ReelInwardService.getById(id);
      if (!reel) return errorResponse('Reel Inward record not found', 404);
      return successResponse(reel);
    }

    const poId = searchParams.get('poId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const qcStatus = searchParams.get('qcStatus') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { reels, total } = await ReelInwardService.getAll({ poId, supplierId, qcStatus, status, search, page, limit });
    return paginatedResponse(reels, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Reel Inward', 403);
    }

    const body = await req.json();
    const reel = await ReelInwardService.create(body, user);
    return successResponse(reel, 'Reel Inward created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Reel Inward', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Reel Inward ID required', 400);

    const body = await req.json();
    const reel = await ReelInwardService.update(id, body, user);
    return successResponse(reel, 'Reel Inward updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Reel Inward', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Reel Inward ID required', 400);

    const deleted = await ReelInwardService.delete(id, user);
    return successResponse(deleted, 'Reel Inward deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}
