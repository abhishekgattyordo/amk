import { NextRequest } from 'next/server';
import { AuditService } from '../../../services/audit.service';
import { successResponse, errorResponse } from '../../../utils/api';
import { getAuthUser } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');

    if (!entity || !entityId) {
      return errorResponse('Entity type and entityId are required', 400);
    }

    const history = await AuditService.getHistory(entity, entityId);
    return successResponse(history);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
