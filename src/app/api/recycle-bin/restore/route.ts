import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // In a real app, you would check auth here:
  // const user = await getAuthorizedUser(req as any);
  // if (!user || (user.role?.name !== 'Administrator' && user.role !== 'Administrator')) { ... }

  try {
    const { type, id } = await req.json();
    let result;
    const data = { isDeleted: false, deletedAt: null, deletedBy: null };
    
    switch (type) {
      case 'product': result = await prisma.product.update({ where: { id }, data }); break;
      case 'rawMaterial': result = await prisma.rawMaterial.update({ where: { id }, data }); break;
      case 'category': result = await prisma.category.update({ where: { id }, data }); break;
      case 'subCategory': result = await prisma.subCategory.update({ where: { id }, data }); break;
      case 'materialGroup': result = await prisma.materialGroup.update({ where: { id }, data }); break;
      case 'supplier': result = await prisma.supplier.update({ where: { id }, data }); break;
      case 'warehouse': result = await prisma.warehouse.update({ where: { id }, data }); break;
      case 'purchaseOrder': result = await prisma.purchaseOrder.update({ where: { id }, data }); break;
      case 'rfq': result = await prisma.rFQ.update({ where: { id }, data }); break;
      case 'supplierQuotation': result = await prisma.supplierQuotation.update({ where: { id }, data }); break;
      default: return NextResponse.json({ success: false, error: 'Invalid entity type' }, { status: 400 });
    }
        
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error restoring item:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to restore item' }, { status: 500 });
  }
}
