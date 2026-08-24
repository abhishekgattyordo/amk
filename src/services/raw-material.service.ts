import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';

export class RawMaterialService {
  static async getAll(query?: { search?: string; categoryId?: string; supplierId?: string; warehouseId?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.categoryId) where.category = query.categoryId;
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.warehouseId) where.warehouseId = query.warehouseId;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { grade: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.rawMaterial.findMany({
        where,
        include: {
          group: true,
          supplier: true,
          warehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rawMaterial.count({ where }),
    ]);

    return { materials, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        group: true,
        supplier: true,
        warehouse: true,
        stockLevels: true,
        transactions: true,
      },
    });
  }

  static async create(data: any, userId?: string, userName?: string) {
    const { supplierId, warehouseId, ...rest } = data;
    delete rest.supplier;
    delete rest.warehouse;

    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplierExists) throw new Error('Supplier not found');
      rest.supplier = { connect: { id: supplierId } };
    }

    if (warehouseId) {
      const warehouseExists = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouseExists) throw new Error('Warehouse not found');
      rest.warehouse = { connect: { id: warehouseId } };
    }

    const material = await prisma.rawMaterial.create({ 
      data: rest,
      include: {
        supplier: true,
        warehouse: true,
        group: true
      }
    });

    // Log creation
    await AuditService.logCreate('RawMaterial', material.id, material, userId, userName);

    return material;
  }

  static async update(id: string, data: any, userId?: string, userName?: string) {
    const oldMaterial = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!oldMaterial) throw new Error('Raw Material not found');

    const { supplierId, warehouseId, ...rest } = data;
    delete rest.supplier;
    delete rest.warehouse;

    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplierExists) throw new Error('Supplier not found');
      rest.supplier = { connect: { id: supplierId } };
    }

    if (warehouseId) {
      const warehouseExists = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouseExists) throw new Error('Warehouse not found');
      rest.warehouse = { connect: { id: warehouseId } };
    }

    const updatedMaterial = await prisma.rawMaterial.update({ 
      where: { id }, 
      data: rest,
      include: {
        supplier: true,
        warehouse: true,
        group: true
      }
    });

    // Log changes
    await AuditService.logChanges('RawMaterial', id, oldMaterial, updatedMaterial, userId, userName);

    return updatedMaterial;
  }

  static async delete(id: string, userId?: string, userName?: string) {
    const oldMaterial = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!oldMaterial) throw new Error('Raw Material not found');

    const updatedMaterial = await prisma.rawMaterial.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });

    await AuditService.logChanges('RawMaterial', id, oldMaterial, updatedMaterial, userId, userName);
    return updatedMaterial;
  }
}
