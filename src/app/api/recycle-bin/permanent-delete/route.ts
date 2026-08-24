import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { AuditService } from '../../../../services/audit.service';

export async function DELETE(req: Request) {
  try {
    const { type, id, userId, userName, userRole } = await req.json();

    // Permission check
    if (userRole !== 'Administrator') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin permission required' }, { status: 403 });
    }

    let result;
    // Perform physical delete
    switch (type) {
      case 'product': result = await prisma.product.delete({ where: { id } }); break;
      case 'rawMaterial': result = await prisma.rawMaterial.delete({ where: { id } }); break;
      case 'category': result = await prisma.category.delete({ where: { id } }); break;
      case 'subCategory': result = await prisma.subCategory.delete({ where: { id } }); break;
      case 'materialGroup': result = await prisma.materialGroup.delete({ where: { id } }); break;
      case 'supplier': result = await prisma.supplier.delete({ where: { id } }); break;
      case 'warehouse': result = await prisma.warehouse.delete({ where: { id } }); break;
      case 'purchaseOrder': result = await prisma.purchaseOrder.delete({ where: { id } }); break;
      case 'rfq': result = await prisma.rFQ.delete({ where: { id } }); break;
      case 'supplierQuotation': result = await prisma.supplierQuotation.delete({ where: { id } }); break;
      default: return NextResponse.json({ success: false, error: 'Invalid entity type' }, { status: 400 });
    }

    // Log the permanent deletion
    await AuditService.logAction(
      'PERMANENT_DELETE',
      type,
      id,
      `Permanently deleted ${type} with ID ${id}`,
      null, // Pass null if userId is not a valid ID
      userName
    );
        
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error permanently deleting item:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete item permanently' }, { status: 500 });
  }
}
