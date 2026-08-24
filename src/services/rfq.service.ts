import { prisma } from '../lib/prisma';

export class RFQService {
  static async getAll(query?: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { rfqNumber: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        include: { materials: true, suppliers: true, quotations: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rFQ.count({ where }),
    ]);

    return { rfqs, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: { materials: true, suppliers: true, quotations: true, purchaseOrders: true },
    });
  }

  static async create(data: any) {
    const { materials, suppliers, ...rfqData } = data;
    const rfqNumber = rfqData.rfqNumber || `RFQ-${Date.now().toString().slice(-6)}`;

    return prisma.$transaction(async (tx) => {
      const rfq = await tx.rFQ.create({
        data: {
          ...rfqData,
          rfqNumber,
          materials: materials?.length ? { create: materials } : undefined,
          suppliers: suppliers?.length ? { create: suppliers } : undefined,
        },
        include: { materials: true, suppliers: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'RFQ_CREATED',
          module: 'Procurement',
          entity: 'RFQ',
          entityId: rfq.id,
          details: `Created RFQ ${rfq.rfqNumber}`,
        },
      });

      return rfq;
    });
  }

  static async update(id: string, data: any) {
    const { materials, suppliers, ...rfqData } = data;

    return prisma.$transaction(async (tx) => {
      if (materials) {
        await tx.rFQMaterial.deleteMany({ where: { rfqId: id } });
      }
      if (suppliers) {
        await tx.rFQSupplier.deleteMany({ where: { rfqId: id } });
      }

      const updated = await tx.rFQ.update({
        where: { id },
        data: {
          ...rfqData,
          materials: materials?.length ? { create: materials } : undefined,
          suppliers: suppliers?.length ? { create: suppliers } : undefined,
        },
        include: { materials: true, suppliers: true },
      });

      return updated;
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.rFQ.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
