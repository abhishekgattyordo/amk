import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [products, rawMaterials, categories, subCategories, materialGroups, suppliers, warehouses, purchaseOrders, rfqs, supplierQuotations] = await Promise.all([
      prisma.product.findMany({ where: { isDeleted: true } }),
      prisma.rawMaterial.findMany({ where: { isDeleted: true } }),
      prisma.category.findMany({ where: { isDeleted: true } }),
      prisma.subCategory.findMany({ where: { isDeleted: true } }),
      prisma.materialGroup.findMany({ where: { isDeleted: true } }),
      prisma.supplier.findMany({ where: { isDeleted: true } }),
      prisma.warehouse.findMany({ where: { isDeleted: true } }),
      prisma.purchaseOrder.findMany({ where: { isDeleted: true } }),
      prisma.rFQ.findMany({ where: { isDeleted: true } }),
      prisma.supplierQuotation.findMany({ where: { isDeleted: true } }),
    ]);

    const formatItems = (items: any[], module: string, page: string, nameField: string | ((item: any) => string), type: string) => 
      items.map(item => ({
        id: item.id,
        type,
        module,
        page,
        recordName: typeof nameField === 'function' ? nameField(item) : item[nameField],
        deletedBy: item.deletedBy || 'Administrator',
        deletedAt: item.deletedAt,
      }));

    const allDeletedItems = [
      ...formatItems(products, 'Inventory', 'Finished Products List', (p) => p.code ? `${p.code} - ${p.name}` : p.name, 'product'),
      ...formatItems(rawMaterials, 'Raw Materials', 'Raw Materials List', (r) => r.code ? `${r.code} - ${r.name}` : r.name, 'rawMaterial'),
      ...formatItems(categories, 'Master Data', 'Categories', 'name', 'category'),
      ...formatItems(subCategories, 'Master Data', 'Subcategories', 'name', 'subCategory'),
      ...formatItems(materialGroups, 'Master Data', 'Material Groups', 'name', 'materialGroup'),
      ...formatItems(suppliers, 'Master Data', 'Suppliers', (s) => `${s.supplierName} - ${s.millName}`, 'supplier'),
      ...formatItems(warehouses, 'Master Data', 'Warehouses', 'name', 'warehouse'),
      ...formatItems(purchaseOrders, 'Procurement', 'Purchase Order List', 'poNumber', 'purchaseOrder'),
      ...formatItems(rfqs, 'Procurement', 'RFQ List', 'rfqNumber', 'rfq'),
      ...formatItems(supplierQuotations, 'Procurement', 'Quotations List', 'quoteNumber', 'supplierQuotation'),
    ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return NextResponse.json({
      success: true,
      data: allDeletedItems
    });
  } catch (error) {
    console.error('Error fetching recycle bin:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch recycle bin' }, { status: 500 });
  }
}
