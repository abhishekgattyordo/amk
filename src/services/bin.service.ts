import { prisma } from '../lib/prisma';

export class BinService {
  private static async getReelsForBins(binIds: string[], binCodes: string[]) {
    try {
      const qcs = await prisma.qualityCheck.findMany({
        where: {
          referenceType: 'Reel Inward',
        },
        include: {
          reelInward: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const binIdSet = new Set(binIds);
      const binCodeSet = new Set(binCodes);
      const reelsByBin: Record<string, any[]> = {};

      const reversalTxns = await prisma.inventoryTransaction.findMany({
        where: {
          transactionType: { in: ['Stock Out', 'Stock Adjustment', 'Production Consumption'] },
          referenceType: 'Reel Inward QC',
        },
        select: { referenceNumber: true },
      });
      const reversedReelNumbers = new Set(reversalTxns.map(t => t.referenceNumber).filter(Boolean));
      const processedReelNumbers = new Set<string>();

      for (const qc of qcs) {
        if (!qc.parameters) continue;
        let rows: any[] = [];
        try {
          rows = JSON.parse(qc.parameters);
        } catch {
          continue;
        }
        if (!Array.isArray(rows)) continue;

        for (const row of rows) {
          const reelNo = (row.reelNo || row.reelNumber || '').trim();
          if (!reelNo || processedReelNumbers.has(reelNo.toUpperCase())) continue;

          const isPassed = 
            row.result === 'Passed' || 
            row.result === 'PASSED' || 
            row.result === 'Approved' || 
            row.result === 'APPROVED';

          if (!isPassed || reversedReelNumbers.has(reelNo)) continue;

          const rowBinId = row.binId;
          const rowBinCode = row.binCode;

          let matchedKey = '';
          if (rowBinId && binIdSet.has(rowBinId)) {
            matchedKey = rowBinId;
          } else if (rowBinCode && binCodeSet.has(rowBinCode)) {
            matchedKey = rowBinCode;
          }

          if (matchedKey) {
            processedReelNumbers.add(reelNo.toUpperCase());
            if (!reelsByBin[matchedKey]) reelsByBin[matchedKey] = [];

            reelsByBin[matchedKey].push({
              id: `${qc.id}-${reelNo}`,
              reelNumber: reelNo,
              material: row.material || qc.reelInward?.description || 'Paper Reel',
              weight: Number(row.netWeight || row.weight || 0),
              uom: 'Kg',
              gsm: row.observationGsm ? Number(row.observationGsm) : (row.gsm ? Number(row.gsm) : qc.reelInward?.gsm || 0),
              bf: row.observationBf ? Number(row.observationBf) : (row.bf ? Number(row.bf) : qc.reelInward?.bf || 0),
              lotNumber: row.lotNumber || null,
              qcStatus: 'Approved',
              inwardNumber: qc.reelInward?.inwardNumber || qc.reelInward?.reelNumber || '',
              qcNumber: qc.qcNumber,
              date: qc.testedAt ? new Date(qc.testedAt).toISOString().split('T')[0] : '',
            });
          }
        }
      }

      return reelsByBin;
    } catch (err) {
      console.error('Error fetching reels for bins:', err);
      return {};
    }
  }

  static async getAll(query?: { search?: string; warehouseId?: string; status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.warehouseId) where.warehouseId = query.warehouseId;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rawBins, total] = await Promise.all([
      prisma.binLocation.findMany({
        where,
        include: {
          warehouse: true,
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
      prisma.binLocation.count({ where }),
    ]);

    const binIds = rawBins.map(b => b.id);
    const binCodes = rawBins.map(b => b.code);
    const reelsByBin = await this.getReelsForBins(binIds, binCodes);

    const bins = rawBins.map((bin) => {
      const activeStockLevels = (bin.stockLevels || []).filter((sl) => (sl.currentStock || 0) > 0);
      const totalStock = activeStockLevels.reduce((sum, sl) => sum + (sl.currentStock || 0), 0);
      const items = activeStockLevels.map((sl) => {
        const itemObj = sl.rawMaterial || sl.product;
        return {
          id: sl.id,
          itemId: sl.rawMaterialId || sl.productId || '',
          itemType: sl.itemType || (sl.rawMaterialId ? 'RAW_MATERIAL' : 'PRODUCT'),
          code: itemObj?.code || 'N/A',
          name: itemObj?.name || 'Item',
          category: (itemObj as any)?.category || '',
          quantity: sl.currentStock || 0,
          uom: (itemObj as any)?.uom || (itemObj as any)?.unit || 'Kg',
        };
      });

      const reels = reelsByBin[bin.id] || reelsByBin[bin.code] || [];
      const storedReelsCount = reels.length;
      const reelsWeight = reels.reduce((s, r) => s + (r.weight || 0), 0);
      const effectiveStock = totalStock > 0 ? totalStock : reelsWeight;

      return {
        ...bin,
        warehouseName: bin.warehouse?.name || 'Unknown',
        warehouseCode: bin.warehouse?.code || '',
        currentStock: effectiveStock,
        storedItemsCount: items.length,
        storedReelsCount,
        items,
        reels,
      };
    });

    return { bins, total, page, limit };
  }

  static async getById(id: string) {
    const bin = await prisma.binLocation.findUnique({
      where: { id },
      include: {
        warehouse: true,
        stockLevels: {
          include: {
            rawMaterial: true,
            product: true,
          },
        },
      },
    });

    if (!bin) return null;

    const reelsByBin = await this.getReelsForBins([bin.id], [bin.code]);
    const activeStockLevels = (bin.stockLevels || []).filter((sl) => (sl.currentStock || 0) > 0);
    const totalStock = activeStockLevels.reduce((sum, sl) => sum + (sl.currentStock || 0), 0);
    const items = activeStockLevels.map((sl) => {
      const itemObj = sl.rawMaterial || sl.product;
      return {
        id: sl.id,
        itemId: sl.rawMaterialId || sl.productId || '',
        itemType: sl.itemType || (sl.rawMaterialId ? 'RAW_MATERIAL' : 'PRODUCT'),
        code: itemObj?.code || 'N/A',
        name: itemObj?.name || 'Item',
        category: (itemObj as any)?.category || '',
        quantity: sl.currentStock || 0,
        uom: (itemObj as any)?.uom || (itemObj as any)?.unit || 'Kg',
      };
    });

    const reels = reelsByBin[bin.id] || reelsByBin[bin.code] || [];
    const storedReelsCount = reels.length;
    const reelsWeight = reels.reduce((s, r) => s + (r.weight || 0), 0);
    const effectiveStock = totalStock > 0 ? totalStock : reelsWeight;

    return {
      ...bin,
      warehouseName: bin.warehouse?.name || 'Unknown',
      warehouseCode: bin.warehouse?.code || '',
      currentStock: effectiveStock,
      storedItemsCount: items.length,
      storedReelsCount,
      items,
      reels,
    };
  }

  static async create(data: any) {
    return prisma.binLocation.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.binLocation.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.binLocation.delete({ where: { id } });
  }
}

