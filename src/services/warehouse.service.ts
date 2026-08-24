import { prisma } from '../lib/prisma';
import { BinService } from './bin.service';

export class WarehouseService {
  static async getAll(query?: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.status && query.status !== 'all') where.status = query.status;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { manager: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rawWarehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          rawMaterials: { where: { isDeleted: false } },
          products: { where: { isDeleted: false } },
          bins: {
            include: {
              stockLevels: {
                include: {
                  rawMaterial: true,
                  product: true,
                },
              },
            },
          },
          stockLevels: {
            include: {
              rawMaterial: true,
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.warehouse.count({ where }),
    ]);

    const warehouses = rawWarehouses.map((wh) => {
      const activeRm = wh.rawMaterials.filter((r) => (r.currentStock || 0) > 0);
      const activePr = wh.products.filter((p) => (p.availableStock || 0) > 0);
      const activeSl = wh.stockLevels.filter((s) => (s.currentStock || 0) > 0);

      const uniqueRmIds = new Set(activeRm.map((r) => r.id));
      const uniquePrIds = new Set(activePr.map((p) => p.id));
      activeSl.forEach((sl) => {
        if (sl.rawMaterialId) uniqueRmIds.add(sl.rawMaterialId);
        if (sl.productId) uniquePrIds.add(sl.productId);
      });

      const activeItemsCount = uniqueRmIds.size + uniquePrIds.size;
      const totalBins = wh.bins?.length ?? (wh.totalBins || 0);

      const totalRawStock = wh.rawMaterials.reduce((sum, r) => sum + (r.currentStock || 0), 0);
      const totalPrStock = wh.products.reduce((sum, p) => sum + (p.availableStock || 0), 0);
      const totalSlStock = wh.stockLevels.reduce((sum, sl) => sum + (sl.currentStock || 0), 0);
      const totalStockKg = totalSlStock > 0 ? totalSlStock : (totalRawStock + totalPrStock);

      const capacitySqFt = wh.capacitySqFt || 0;
      let currentUtilizationPercent = 0;
      if (capacitySqFt > 0 && totalStockKg > 0) {
        currentUtilizationPercent = Math.min(100, Math.round((totalStockKg / capacitySqFt) * 100));
      }

      return {
        ...wh,
        totalBins,
        activeItemsCount: activeItemsCount || (wh.activeItemsCount || 0),
        currentUtilizationPercent,
        currentStockTotal: totalStockKg,
      };
    });

    return { warehouses, total, page, limit };
  }

  static async getById(id: string) {
    const wh = await prisma.warehouse.findFirst({
      where: { id, isDeleted: false },
      include: {
        rawMaterials: { where: { isDeleted: false } },
        products: { where: { isDeleted: false } },
        bins: {
          include: {
            stockLevels: {
              include: {
                rawMaterial: true,
                product: true,
              },
            },
          },
        },
        stockLevels: {
          include: {
            rawMaterial: true,
            product: true,
          },
        },
      },
    });

    if (!wh) return null;

    const binIds = wh.bins.map(b => b.id);
    const { bins: detailedBins } = await BinService.getAll({ warehouseId: wh.id, limit: 200 });

    const activeRm = wh.rawMaterials.filter((r) => (r.currentStock || 0) > 0);
    const activePr = wh.products.filter((p) => (p.availableStock || 0) > 0);
    const activeSl = wh.stockLevels.filter((s) => (s.currentStock || 0) > 0);

    const uniqueRmIds = new Set(activeRm.map((r) => r.id));
    const uniquePrIds = new Set(activePr.map((p) => p.id));
    activeSl.forEach((sl) => {
      if (sl.rawMaterialId) uniqueRmIds.add(sl.rawMaterialId);
      if (sl.productId) uniquePrIds.add(sl.productId);
    });

    const activeItemsCount = uniqueRmIds.size + uniquePrIds.size;
    const totalBins = detailedBins.length || wh.bins.length || wh.totalBins || 0;
    const totalRawStock = wh.rawMaterials.reduce((sum, r) => sum + (r.currentStock || 0), 0);
    const totalPrStock = wh.products.reduce((sum, p) => sum + (p.availableStock || 0), 0);
    const totalSlStock = wh.stockLevels.reduce((sum, sl) => sum + (sl.currentStock || 0), 0);
    const totalStockKg = totalSlStock > 0 ? totalSlStock : (totalRawStock + totalPrStock);

    const capacitySqFt = wh.capacitySqFt || 0;
    let currentUtilizationPercent = 0;
    if (capacitySqFt > 0 && totalStockKg > 0) {
      currentUtilizationPercent = Math.min(100, Math.round((totalStockKg / capacitySqFt) * 100));
    }

    return {
      ...wh,
      bins: detailedBins.length > 0 ? detailedBins : wh.bins,
      totalBins,
      activeItemsCount: activeItemsCount || (wh.activeItemsCount || 0),
      currentUtilizationPercent,
      currentStockTotal: totalStockKg,
    };
  }

  static async create(data: any) {
    return prisma.warehouse.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.warehouse.update({ where: { id }, data });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.warehouse.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}

