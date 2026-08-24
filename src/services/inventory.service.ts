import { prisma } from '../lib/prisma';

async function syncRawMaterialStock(tx: any, rawMaterialId: string) {
  const stockLevels = await tx.stockLevel.findMany({
    where: { rawMaterialId }
  });
  const sum = stockLevels.reduce((acc: number, sl: any) => acc + (sl.currentStock || 0), 0);
  await tx.rawMaterial.update({
    where: { id: rawMaterialId },
    data: { currentStock: sum }
  });
  return sum;
}

async function syncProductStock(tx: any, productId: string) {
  const stockLevels = await tx.stockLevel.findMany({
    where: { productId }
  });
  const sum = stockLevels.reduce((acc: number, sl: any) => acc + (sl.currentStock || 0), 0);
  await tx.product.update({
    where: { id: productId },
    data: { availableStock: sum }
  });
  return sum;
}

export class InventoryService {
  // Stock In: Increases stock level & records InventoryTransaction
  static async stockIn(data: {
    materialId?: string;
    productId?: string;
    warehouseId: string;
    quantity: number;
    reason?: string;
    remarks?: string;
    referenceNumber?: string;
    referenceType?: string;
    user?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      let previousStock = 0;
      let currentStock = 0;
      let itemCode = '';
      let itemName = '';
      let itemType = 'Raw Material';

      // 1. Resolve item and update StockLevel in specific Warehouse (and default bin if applicable)
      if (data.materialId) {
        const material = await tx.rawMaterial.findUnique({ where: { id: data.materialId } });
        if (!material) throw new Error('Raw Material not found');
        previousStock = material.currentStock;
        itemCode = material.code || '';
        itemName = material.name;
        itemType = 'Raw Material';
      } else if (data.productId) {
        const product = await tx.product.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error('Product not found');
        previousStock = product.availableStock;
        itemCode = product.code || '';
        itemName = product.name;
        itemType = 'Finished Product';
      }

      // 2. Upsert StockLevel for warehouse
      if (data.warehouseId) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: data.materialId ? 'RAW_MATERIAL' : 'PRODUCT',
            rawMaterialId: data.materialId || undefined,
            productId: data.productId || undefined,
            warehouseId: data.warehouseId,
          },
        });

        if (existingSL) {
          await tx.stockLevel.update({
            where: { id: existingSL.id },
            data: { currentStock: existingSL.currentStock + data.quantity },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              itemType: data.materialId ? 'RAW_MATERIAL' : 'PRODUCT',
              rawMaterialId: data.materialId,
              productId: data.productId,
              warehouseId: data.warehouseId,
              currentStock: data.quantity,
            },
          });
        }
      }

      // 3. Synchronize global stock
      if (data.materialId) {
        currentStock = await syncRawMaterialStock(tx, data.materialId);
      } else if (data.productId) {
        currentStock = await syncProductStock(tx, data.productId);
      }

      const transactionNumber = `TXN-IN-${Date.now()}`;
      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionNumber,
          itemCode,
          itemName,
          itemType,
          rawMaterialId: data.materialId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          previousStock,
          currentStock,
          transactionType: 'Stock In',
          user: data.user || 'System',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          reason: data.reason || 'Manual Stock In',
          remarks: data.remarks,
          referenceNumber: data.referenceNumber,
          referenceType: data.referenceType || 'Manual',
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'STOCK_IN',
          entity: data.materialId ? 'RawMaterial' : 'Product',
          entityId: data.materialId || data.productId || '',
          user: data.user || 'System',
          details: `Added ${data.quantity} units. Previous: ${previousStock}, New: ${currentStock}`,
        },
      });

      return transaction;
    }, { maxWait: 15000, timeout: 30000 });
  }

  // Stock Out: Decreases stock level & records InventoryTransaction
  static async stockOut(data: {
    materialId?: string;
    productId?: string;
    warehouseId: string;
    quantity: number;
    reason?: string;
    remarks?: string;
    referenceNumber?: string;
    referenceType?: string;
    user?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      let previousStock = 0;
      let currentStock = 0;
      let itemCode = '';
      let itemName = '';
      let itemType = 'Raw Material';

      if (data.materialId) {
        const material = await tx.rawMaterial.findUnique({ where: { id: data.materialId } });
        if (!material) throw new Error('Raw Material not found');
        previousStock = material.currentStock;
        itemCode = material.code || '';
        itemName = material.name;
        itemType = 'Raw Material';
      } else if (data.productId) {
        const product = await tx.product.findUnique({ where: { id: data.productId } });
        if (!product) throw new Error('Product not found');
        previousStock = product.availableStock;
        itemCode = product.code || '';
        itemName = product.name;
        itemType = 'Finished Product';
      }

      // Check and update StockLevel in the specific warehouse
      if (data.warehouseId) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: data.materialId ? 'RAW_MATERIAL' : 'PRODUCT',
            rawMaterialId: data.materialId || undefined,
            productId: data.productId || undefined,
            warehouseId: data.warehouseId,
          },
        });

        if (!existingSL || existingSL.currentStock < data.quantity) {
          throw new Error(`Insufficient stock in selected warehouse. Available: ${existingSL?.currentStock || 0}, Requested: ${data.quantity}`);
        }

        await tx.stockLevel.update({
          where: { id: existingSL.id },
          data: { currentStock: Math.max(0, existingSL.currentStock - data.quantity) },
        });
      }

      // Synchronize parent stock fields
      if (data.materialId) {
        currentStock = await syncRawMaterialStock(tx, data.materialId);
      } else if (data.productId) {
        currentStock = await syncProductStock(tx, data.productId);
      }

      const transactionNumber = `TXN-OUT-${Date.now()}`;
      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionNumber,
          itemCode,
          itemName,
          itemType,
          rawMaterialId: data.materialId,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          previousStock,
          currentStock,
          transactionType: 'Stock Out',
          user: data.user || 'System',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          reason: data.reason || 'Manual Stock Out',
          remarks: data.remarks,
          referenceNumber: data.referenceNumber,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'STOCK_OUT',
          entity: data.materialId ? 'RawMaterial' : 'Product',
          entityId: data.materialId || data.productId || '',
          user: data.user || 'System',
          details: `Deducted ${data.quantity} units. Previous: ${previousStock}, New: ${currentStock}`,
        },
      });

      return transaction;
    }, { maxWait: 15000, timeout: 30000 });
  }

  // Warehouse Transfer: Moves items between warehouses
  static async warehouseTransfer(data: {
    materialId?: string;
    productId?: string;
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    quantity: number;
    remarks?: string;
    user?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      let itemCode = '';
      let itemName = '';
      let itemType = 'Raw Material';

      // 1. Check and deduct from source warehouse StockLevel
      const sourceSL = await tx.stockLevel.findFirst({
        where: {
          itemType: data.materialId ? 'RAW_MATERIAL' : 'PRODUCT',
          rawMaterialId: data.materialId || undefined,
          productId: data.productId || undefined,
          warehouseId: data.sourceWarehouseId,
        },
      });

      if (!sourceSL || sourceSL.currentStock < data.quantity) {
        throw new Error(`Insufficient stock in source warehouse. Available: ${sourceSL?.currentStock || 0}`);
      }

      await tx.stockLevel.update({
        where: { id: sourceSL.id },
        data: { currentStock: sourceSL.currentStock - data.quantity },
      });

      // 2. Add to destination warehouse StockLevel
      const destSL = await tx.stockLevel.findFirst({
        where: {
          itemType: data.materialId ? 'RAW_MATERIAL' : 'PRODUCT',
          rawMaterialId: data.materialId || undefined,
          productId: data.productId || undefined,
          warehouseId: data.destinationWarehouseId,
          binId: sourceSL.binId, // keep same bin reference if any
        },
      });

      if (destSL) {
        await tx.stockLevel.update({
          where: { id: destSL.id },
          data: { currentStock: destSL.currentStock + data.quantity },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            itemType: data.materialId ? 'RAW_MATERIAL' : 'PRODUCT',
            rawMaterialId: data.materialId,
            productId: data.productId,
            warehouseId: data.destinationWarehouseId,
            binId: sourceSL.binId,
            currentStock: data.quantity,
          },
        });
      }

      // 3. Sync and calculate global stock
      let previousStock = 0;
      let currentStock = 0;
      if (data.materialId) {
        const mat = await tx.rawMaterial.findUnique({ where: { id: data.materialId } });
        if (!mat) throw new Error('Material not found');
        itemCode = mat.code || '';
        itemName = mat.name;
        previousStock = mat.currentStock;
        currentStock = await syncRawMaterialStock(tx, data.materialId);
      } else if (data.productId) {
        const prod = await tx.product.findUnique({ where: { id: data.productId } });
        if (!prod) throw new Error('Product not found');
        itemCode = prod.code || '';
        itemName = prod.name;
        itemType = 'Finished Product';
        previousStock = prod.availableStock;
        currentStock = await syncProductStock(tx, data.productId);
      }

      const transactionNumber = `TXN-TRF-${Date.now()}`;
      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionNumber,
          itemCode,
          itemName,
          itemType,
          rawMaterialId: data.materialId,
          productId: data.productId,
          warehouseId: data.sourceWarehouseId,
          destinationWarehouseId: data.destinationWarehouseId,
          quantity: data.quantity,
          previousStock,
          currentStock,
          transactionType: 'Warehouse Transfer',
          user: data.user || 'System',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          remarks: data.remarks || `Transferred from source to destination`,
        },
      });

      return transaction;
    }, { maxWait: 15000, timeout: 30000 });
  }

  // Stock Adjustment
  static async stockAdjustment(data: {
    itemType: 'RAW_MATERIAL' | 'PRODUCT';
    itemId: string;
    warehouseId?: string;
    quantity: number;
    reason: string;
    user?: string;
    remarks?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const adjustmentNumber = `ADJ-${Date.now()}`;
      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentNumber,
          itemType: data.itemType,
          itemId: data.itemId,
          quantity: data.quantity,
          reason: data.reason,
          adjustedBy: data.user || 'System',
        },
      });

      let whIdToUse = data.warehouseId;
      if (!whIdToUse) {
        if (data.itemType === 'RAW_MATERIAL') {
          const mat = await tx.rawMaterial.findUnique({ where: { id: data.itemId } });
          whIdToUse = mat?.warehouseId || undefined;
        } else {
          const prod = await tx.product.findUnique({ where: { id: data.itemId } });
          whIdToUse = prod?.warehouseId || undefined;
        }
      }

      if (!whIdToUse) {
        const defaultWh = await tx.warehouse.findFirst({ where: { isDeleted: false } });
        whIdToUse = defaultWh?.id;
      }

      if (whIdToUse) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: data.itemType,
            rawMaterialId: data.itemType === 'RAW_MATERIAL' ? data.itemId : undefined,
            productId: data.itemType === 'PRODUCT' ? data.itemId : undefined,
            warehouseId: whIdToUse,
          },
        });

        if (existingSL) {
          await tx.stockLevel.update({
            where: { id: existingSL.id },
            data: { currentStock: Math.max(0, existingSL.currentStock + data.quantity) },
          });
        } else if (data.quantity > 0) {
          await tx.stockLevel.create({
            data: {
              itemType: data.itemType,
              rawMaterialId: data.itemType === 'RAW_MATERIAL' ? data.itemId : null,
              productId: data.itemType === 'PRODUCT' ? data.itemId : null,
              warehouseId: whIdToUse,
              currentStock: data.quantity,
            },
          });
        }
      }

      let itemCode = '';
      let itemName = '';
      let previousStock = 0;
      let currentStock = 0;

      if (data.itemType === 'RAW_MATERIAL') {
        currentStock = await syncRawMaterialStock(tx, data.itemId);
        const mat = await tx.rawMaterial.findUnique({ where: { id: data.itemId } });
        if (mat) {
          itemCode = mat.code || '';
          itemName = mat.name;
          previousStock = mat.currentStock - data.quantity; // approximate previous
        }
      } else {
        currentStock = await syncProductStock(tx, data.itemId);
        const prod = await tx.product.findUnique({ where: { id: data.itemId } });
        if (prod) {
          itemCode = prod.code || '';
          itemName = prod.name;
          previousStock = prod.availableStock - data.quantity; // approximate previous
        }
      }

      await tx.inventoryTransaction.create({
        data: {
          transactionNumber: `TXN-ADJ-${Date.now()}`,
          itemCode,
          itemName,
          itemType: data.itemType === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Product',
          rawMaterialId: data.itemType === 'RAW_MATERIAL' ? data.itemId : null,
          productId: data.itemType === 'PRODUCT' ? data.itemId : null,
          warehouseId: whIdToUse,
          quantity: Math.abs(data.quantity),
          previousStock: Math.max(0, previousStock),
          currentStock,
          transactionType: 'Stock Adjustment',
          reason: data.reason,
          user: data.user || 'System',
          date: new Date().toISOString().split('T')[0],
        },
      });

      return adjustment;
    }, { maxWait: 15000, timeout: 30000 });
  }

  // Get current stock levels
  static async getStockLevels(query?: { warehouseId?: string; itemType?: string; search?: string }) {
    const where: any = {};
    if (query?.warehouseId) where.warehouseId = query.warehouseId;
    if (query?.itemType) where.itemType = query.itemType;

    return prisma.stockLevel.findMany({
      where,
      include: {
        rawMaterial: true,
        product: true,
        warehouse: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
