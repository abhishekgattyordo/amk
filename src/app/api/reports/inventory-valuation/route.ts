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
        purchasePrice: true,
        uom: true
      }
    });

    const products = await prisma.product.findMany({
      select: {
        name: true,
        code: true,
        availableStock: true,
        costPrice: true,
        unit: true
      }
    });

    const valuationData = [
      ...rawMaterials.map(rm => ({
        type: 'Raw Material',
        name: rm.name,
        code: rm.code,
        quantity: rm.currentStock,
        price: rm.purchasePrice,
        totalValue: rm.currentStock * rm.purchasePrice,
        uom: rm.uom
      })),
      ...products.map(p => ({
        type: 'Finished Product',
        name: p.name,
        code: p.code,
        quantity: p.availableStock,
        price: p.costPrice,
        totalValue: p.availableStock * p.costPrice,
        uom: p.unit
      }))
    ];

    return NextResponse.json({ success: true, data: valuationData });
  } catch (error) {
    console.error('Error generating inventory valuation report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
