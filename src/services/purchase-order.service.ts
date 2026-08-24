import { prisma } from '../lib/prisma';

export class PurchaseOrderService {
  static async getAll(query?: { supplierId?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { poNumber: { contains: query.search, mode: 'insensitive' } },
        { rfqNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: true, gateEntries: true, reelInwards: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { pos, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: true, gateEntries: true, reelInwards: true },
    });
  }

  static async create(data: any) {
    const { items, ...poData } = data;
    const poNumber = poData.poNumber || `PO-${Date.now().toString().slice(-6)}`;

    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...poData,
          poNumber,
          items: items?.length ? { create: items } : undefined,
        },
        include: { supplier: true, items: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'PURCHASE_ORDER_CREATED',
          module: 'Procurement',
          entity: 'PurchaseOrder',
          entityId: po.id,
          details: `Created Purchase Order ${po.poNumber}`,
        },
      });

      return po;
    });
  }

  static async update(id: string, data: any) {
    const { items, ...poData } = data;

    return prisma.$transaction(async (tx) => {
      if (items) {
        await tx.purchaseOrderItem.deleteMany({ where: { poId: id } });
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...poData,
          items: items?.length ? { create: items } : undefined,
        },
        include: { supplier: true, items: true },
      });

      return updated;
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.purchaseOrder.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
