import { NextRequest } from 'next/server';
import { QualityCheckService } from '../../../services/quality-check.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_qc:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Quality Control Checks', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const check = await QualityCheckService.getById(id);
      if (!check) return errorResponse('Quality check record not found', 404);
      return successResponse(check);
    }

    const referenceType = searchParams.get('referenceType') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { checks, total } = await QualityCheckService.getAll({ referenceType, status, search, page, limit });
    return paginatedResponse(checks, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_qc:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Record Quality Control Checks', 403);
    }

    const body = await req.json();
    const check = await QualityCheckService.create(body);
    return successResponse(check, 'Quality check recorded successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_qc:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Quality Control Checks', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Quality Check ID required', 400);

    const body = await req.json();
    const check = await QualityCheckService.update(id, body);
    return successResponse(check, 'Quality Check updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
