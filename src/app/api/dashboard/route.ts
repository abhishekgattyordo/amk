import { NextRequest } from 'next/server';
import { DashboardService } from '../../../services/dashboard.service';
import { successResponse, errorResponse } from '../../../utils/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const data = await DashboardService.getDashboardMetrics();
    return successResponse(data, 'Dashboard metrics retrieved successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
