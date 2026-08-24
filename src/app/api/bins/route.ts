import { NextRequest } from 'next/server';
import { BinService } from '../../../services/bin.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const result = await BinService.getAll({ search, warehouseId, status, page, limit });
    return paginatedResponse(result.bins, result.total, page, limit);
  } catch (error: any) {
    return errorResponse(error, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bin = await BinService.create(body);
    return successResponse(bin, 'Bin location created successfully', 201);
  } catch (error: any) {
    return errorResponse(error, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Bin ID required', 400);

    const body = await req.json();
    const bin = await BinService.update(id, body);
    return successResponse(bin, 'Bin location updated successfully');
  } catch (error: any) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = null;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Bin ID required', 400);

    await BinService.delete(id);
    return successResponse(null, 'Bin location deleted successfully');
  } catch (error: any) {
    return errorResponse(error, 400);
  }
}

