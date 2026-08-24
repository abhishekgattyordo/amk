import { NextRequest } from 'next/server';
import { InventoryService } from '../../../services/inventory.service';
import { successResponse, errorResponse } from '../../../utils/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const itemType = searchParams.get('itemType') || undefined;

    const levels = await InventoryService.getStockLevels({ warehouseId, itemType });
    return successResponse(levels);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
