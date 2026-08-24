import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';

export class ProductService {
  static async getAll(query?: { search?: string; category?: string; warehouseId?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.category) where.category = query.category;
    if (query?.warehouseId) where.warehouseId = query.warehouseId;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { warehouse: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { warehouse: true, stockLevels: true, transactions: true },
    });
  }

  static async create(data: any, userId?: string, userName?: string) {
    const { warehouseId, uom, ...rest } = data;
    delete rest.warehouse;

    if (warehouseId) {
      const warehouseExists = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouseExists) throw new Error('Warehouse not found');
      rest.warehouse = { connect: { id: warehouseId } };
    }

    const product = await prisma.product.create({ 
      data: rest,
      include: {
        warehouse: true
      }
    });

    await AuditService.logCreate('Product', product.id, product, userId, userName);

    return product;
  }

  static async update(id: string, data: any, userId?: string, userName?: string) {
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    if (!oldProduct) throw new Error('Product not found');

    const { warehouseId, uom, ...rest } = data;
    delete rest.warehouse;

    if (warehouseId) {
      const warehouseExists = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouseExists) throw new Error('Warehouse not found');
      rest.warehouse = { connect: { id: warehouseId } };
    }

    const updatedProduct = await prisma.product.update({ 
      where: { id }, 
      data: rest,
      include: {
        warehouse: true
      }
    });

    await AuditService.logChanges('Product', id, oldProduct, updatedProduct, userId, userName);

    return updatedProduct;
  }

  static async delete(id: string, userId?: string, userName?: string) {
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    if (!oldProduct) throw new Error('Product not found');

    const updatedProduct = await prisma.product.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });

    await AuditService.logChanges('Product', id, oldProduct, updatedProduct, userId, userName);
    return updatedProduct;
  }
}
