import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const txns = await prisma.inventoryTransaction.findMany({
      where: { transactionType: 'Production Issue' },
      select: {
        itemName: true,
        quantity: true,
        date: true
      }
    });

    return NextResponse.json({ success: true, data: txns });
  } catch (error) {
    console.error('Error generating material consumption:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
