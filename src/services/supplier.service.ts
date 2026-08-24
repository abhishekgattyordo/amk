import { prisma } from '../lib/prisma';

export class SupplierService {
  static async getAll(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.search) {
      where.OR = [
        { supplierName: { contains: query.search, mode: 'insensitive' } },
        { millName: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          rawMaterials: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: { quotations: true, purchaseOrders: true, rawMaterials: true },
    });
  }

  static async create(data: any) {
    return prisma.supplier.create({ data });
  }

  static async findDuplicate(supplierName: string, millName: string, category: string) {
    if (!supplierName || !millName || !category) return null;
    return prisma.supplier.findFirst({
      where: {
        isDeleted: false, deletedAt: null,
        supplierName: { equals: supplierName, mode: 'insensitive' },
        millName: { equals: millName, mode: 'insensitive' },
        category: { equals: category, mode: 'insensitive' },
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.supplier.update({ where: { id }, data });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.supplier.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
