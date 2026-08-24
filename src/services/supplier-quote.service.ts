import { prisma } from '../lib/prisma';

export class SupplierQuoteService {
  static async getAll(query?: { rfqId?: string; supplierId?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.rfqId) where.rfqId = query.rfqId;
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.search) {
      where.OR = [
        { quoteNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.supplierQuotation.findMany({
        where,
        include: { supplier: true, rfq: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supplierQuotation.count({ where }),
    ]);

    return { quotes, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.supplierQuotation.findUnique({
      where: { id },
      include: { supplier: true, rfq: true, items: true, purchaseOrders: true },
    });
  }

  static async create(data: any) {
    const { items, ...quoteData } = data;
    const quoteNumber = quoteData.quoteNumber || `SQ-${Date.now().toString().slice(-6)}`;

    return prisma.$transaction(async (tx) => {
      const quote = await tx.supplierQuotation.create({
        data: {
          ...quoteData,
          quoteNumber,
          items: items?.length ? { create: items } : undefined,
        },
        include: { supplier: true, items: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'SUPPLIER_QUOTE_CREATED',
          module: 'Procurement',
          entity: 'SupplierQuotation',
          entityId: quote.id,
          details: `Created quotation ${quote.quoteNumber}`,
        },
      });

      return quote;
    }, {
      maxWait: 10000, // Increased from 2000
      timeout: 20000, // Increased from 5000
    });
  }

  static async update(id: string, data: any) {
    const { items, ...quoteData } = data;

    return prisma.$transaction(async (tx) => {
      if (items) {
        await tx.supplierQuoteItem.deleteMany({ where: { quotationId: id } });
      }

      const updated = await tx.supplierQuotation.update({
        where: { id },
        data: {
          ...quoteData,
          items: items?.length ? { create: items } : undefined,
        },
        include: { supplier: true, items: true },
      });

      return updated;
    }, {
      maxWait: 10000, // Increased from 2000
      timeout: 20000, // Increased from 5000
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.supplierQuotation.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
