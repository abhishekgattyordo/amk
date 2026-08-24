import { NextRequest } from 'next/server';
import { GateEntryService } from '../../../services/gate-entry.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Gate Entries', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const entry = await GateEntryService.getById(id);
      if (!entry) return errorResponse('Gate Entry not found', 404);
      return successResponse(entry);
    }

    const poId = searchParams.get('poId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { entries, total } = await GateEntryService.getAll({ poId, status, search, page, limit });
    return paginatedResponse(entries, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Gate Entries', 403);
    }

    const body = await req.json();
    const entry = await GateEntryService.create(body);
    return successResponse(entry, 'Gate Entry created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Gate Entries', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Gate Entry ID required', 400);

    const body = await req.json();
    const entry = await GateEntryService.update(id, body);
    return successResponse(entry, 'Gate Entry updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
