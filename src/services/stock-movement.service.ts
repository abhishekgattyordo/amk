import { prisma } from '../lib/prisma';

export class StockMovementService {
  static async getAll(query?: {
    search?: string;
    transactionType?: string;
    warehouseId?: string;
    materialId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.transactionType) where.transactionType = query.transactionType;
    if (query?.warehouseId) where.warehouseId = query.warehouseId;
    if (query?.materialId) {
      const mat = await prisma.rawMaterial.findUnique({ where: { id: query.materialId } });
      if (mat?.code) {
        where.OR = [
          { rawMaterialId: query.materialId },
          { itemCode: mat.code },
        ];
      } else {
        where.rawMaterialId = query.materialId;
      }
    }
    if (query?.search) {
      const searchWhere = [
        { transactionNumber: { contains: query.search, mode: 'insensitive' } },
        { itemName: { contains: query.search, mode: 'insensitive' } },
        { itemCode: { contains: query.search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchWhere },
        ];
        delete where.OR;
      } else {
        where.OR = searchWhere;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          rawMaterial: true,
          product: true,
          warehouse: true,
          destinationWarehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        rawMaterial: true,
        product: true,
        warehouse: true,
        destinationWarehouse: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.inventoryTransaction.delete({
      where: { id },
    });
  }
}
