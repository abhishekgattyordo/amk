import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { not: 'Completed' } },
      select: {
        totalAmount: true,
        supplier: { select: { supplierName: true } }
      }
    });

    const outstanding: Record<string, number> = {};
    pos.forEach((po: any) => {
      const name = po.supplier.supplierName;
      outstanding[name] = (outstanding[name] || 0) + po.totalAmount;
    });

    const result = Object.entries(outstanding).map(([name, amount]) => ({ supplierName: name, outstandingAmount: amount }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error generating outstanding ledger:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
