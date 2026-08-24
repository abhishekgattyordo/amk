import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany({
      select: {
        name: true,
        code: true,
        currentStock: true,
        minStock: true,
        reorderLevel: true,
        uom: true
      }
    });

    const lowStockItems = rawMaterials.filter(rm => 
      rm.currentStock <= rm.minStock || rm.currentStock <= rm.reorderLevel
    );

    return NextResponse.json({ success: true, data: lowStockItems });
  } catch (error) {
    console.error('Error generating low stock report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
