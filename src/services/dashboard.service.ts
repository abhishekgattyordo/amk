import { prisma } from '../lib/prisma';

export class DashboardService {
  static async getDashboardMetrics() {
    const [
      rawMaterialsCount,
      productsCount,
      suppliersCount,
      warehousesCount,
      pendingPOs,
      activeRFQs,
      recentTransactions,
      unreadNotifications,
      lowStockMaterials,
    ] = await Promise.all([
      prisma.rawMaterial.count({ where: { isDeleted: false, deletedAt: null } }),
      prisma.product.count({ where: { isDeleted: false, deletedAt: null } }),
      prisma.supplier.count(),
      prisma.warehouse.count({ where: { isDeleted: false, deletedAt: null } }),
      prisma.purchaseOrder.count({ where: { status: { in: ['Draft', 'Submitted', 'Pending Approval'] }, isDeleted: false, deletedAt: null } }),
      prisma.rFQ.count({ where: { status: { in: ['Draft', 'Sent', 'Submitted'] }, isDeleted: false, deletedAt: null } }),
      prisma.inventoryTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { rawMaterial: true, product: true, warehouse: true },
      }),
      prisma.notification.count({ where: { read: false } }),
      prisma.rawMaterial.findMany({
        where: {
          isDeleted: false, deletedAt: null,
        },
        take: 5,
        orderBy: { currentStock: 'asc' },
      }),
    ]);

    return {
      overview: {
        rawMaterialsCount,
        productsCount,
        suppliersCount,
        warehousesCount,
        pendingPOs,
        activeRFQs,
        unreadNotifications,
      },
      lowStockMaterials,
      recentTransactions,
    };
  }
}
