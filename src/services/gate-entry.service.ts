import { prisma } from '../lib/prisma';
import { InventoryService } from './inventory.service';

export class GateEntryService {
  static async getAll(query?: { poId?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.poId) where.poId = query.poId;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { gateEntryNumber: { contains: query.search, mode: 'insensitive' } },
        { vehicleNumber: { contains: query.search, mode: 'insensitive' } },
        { poNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.gateEntry.findMany({
        where,
        include: { purchaseOrder: { include: { supplier: true } }, items: true, qualityChecks: true, warehouse: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gateEntry.count({ where }),
    ]);

    return { entries, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.gateEntry.findUnique({
      where: { id },
      include: { purchaseOrder: { include: { supplier: true } }, items: true, qualityChecks: true, warehouse: true },
    });
  }

  static async create(data: any) {
    console.log("GATE ENTRY REQUEST BODY", data);

    const { items, ...entryData } = data;
    const gateEntryNumber = entryData.gateEntryNumber || `GE-${Date.now().toString().slice(-6)}`;

    // FOREIGN KEY VALIDATION (Read-only validation queries outside the transaction)
    // 1. Validate Supplier ID if provided
    const sId = entryData.supplierId || entryData.supplier?.id;
    if (sId) {
      const supplierExists = await prisma.supplier.findUnique({
        where: { id: sId }
      });
      if (!supplierExists) {
        throw new Error(`Supplier ID not found: ${sId}`);
      }
    }

    // 2. Validate Purchase Order ID / Number
    let pId = entryData.poId || entryData.purchaseOrderId;
    let matchedPO = null;

    if (!pId && entryData.poNumber) {
      matchedPO = await prisma.purchaseOrder.findFirst({
        where: { poNumber: entryData.poNumber }
      });
      if (matchedPO) {
        pId = matchedPO.id;
      } else {
        throw new Error(`Purchase Order not found: ${entryData.poNumber}`);
      }
    } else if (pId) {
      matchedPO = await prisma.purchaseOrder.findUnique({
        where: { id: pId }
      });
      if (!matchedPO) {
        throw new Error(`Purchase Order ID not found: ${pId}`);
      }
    }
    console.log("MATCHED PURCHASE ORDER", matchedPO);

    // 3. Validate Warehouse ID if provided
    let matchedWarehouse = null;
    if (entryData.warehouseId) {
      matchedWarehouse = await prisma.warehouse.findUnique({
        where: { id: entryData.warehouseId }
      });
      if (!matchedWarehouse) {
        throw new Error(`Warehouse ID not found: ${entryData.warehouseId}`);
      }
    }
    console.log("MATCHED WAREHOUSE", matchedWarehouse);

    // 4. Validate / Map Materials for each item
    const matchedMaterials: any[] = [];
    const mappedItems: any[] = [];

    if (items && items.length > 0) {
      for (const item of items) {
        let mat = null;

        // If the item has a materialId, validate it
        if (item.materialId) {
          mat = await prisma.rawMaterial.findUnique({
            where: { id: item.materialId }
          });
          if (!mat) {
            throw new Error(`Material ID not found: ${item.materialId}`);
          }
        } else {
          // Attempt to match material in database using:
          // a. materialCode (if valid and not 'RM-CUSTOM')
          if (item.materialCode && item.materialCode !== 'RM-CUSTOM') {
            mat = await prisma.rawMaterial.findFirst({
              where: { code: item.materialCode }
            });
          }

          // b. hsnCode (if provided and still not matched)
          if (!mat && item.hsn) {
            mat = await prisma.rawMaterial.findFirst({
              where: { hsnCode: item.hsn }
            });
          }

          // c. materialName (exact or case-insensitive match and still not matched)
          if (!mat && item.materialName) {
            mat = await prisma.rawMaterial.findFirst({
              where: { name: { equals: item.materialName, mode: 'insensitive' } }
            });
          }
        }

        if (mat) {
          matchedMaterials.push(mat);
          mappedItems.push({
            materialId: mat.id,
            materialCode: mat.code || item.materialCode || 'RM-CUSTOM',
            materialName: mat.name,
            quantityReceived: item.quantityReceived,
            unit: item.unit || mat.uom || 'Kg'
          });
        } else {
          // Material not found in database - use existing custom-material mechanism
          mappedItems.push({
            materialId: null,
            materialCode: item.materialCode || 'RM-CUSTOM',
            materialName: item.materialName,
            quantityReceived: item.quantityReceived,
            unit: item.unit || 'Kg'
          });
        }
      }
    }
    console.log("MATCHED MATERIALS", matchedMaterials);

    // Filter entryData to only valid database fields on GateEntry model to prevent Prisma errors
    let finalRemarks = entryData.remarks || '';
    if (entryData.driverPhone) {
      finalRemarks = `[Driver Phone: ${entryData.driverPhone}] ` + finalRemarks;
    }
    if (entryData.transportCompany) {
      finalRemarks = `[Transporter: ${entryData.transportCompany}] ` + finalRemarks;
    }

    const validatedData: any = {
      gateEntryNumber,
      poNumber: entryData.poNumber || (matchedPO ? matchedPO.poNumber : null),
      vehicleNumber: entryData.vehicleNumber || null,
      driverName: entryData.driverName || null,
      challanNumber: entryData.challanNumber || null,
      challanDate: entryData.challanDate || null,
      entryTime: entryData.entryTime || null,
      status: entryData.status || 'Entered',
      remarks: finalRemarks || null,
      warehouseId: entryData.warehouseId || null,
    };

    if (pId) validatedData.poId = pId;

    console.log("FINAL GATE ENTRY DATA", validatedData);
    console.log("STARTING GATE ENTRY TRANSACTION");

    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log("CREATING GATE ENTRY");
        const entry = await tx.gateEntry.create({
          data: {
            ...validatedData,
            items: mappedItems.length ? {
              create: mappedItems.map((it: any) => ({
                materialId: it.materialId,
                materialCode: it.materialCode,
                materialName: it.materialName,
                quantityReceived: it.quantityReceived,
                unit: it.unit
              }))
            } : undefined,
          },
          include: { items: true, purchaseOrder: true },
        });

        // Update PO status if linked
        if (validatedData.poId) {
          await tx.purchaseOrder.update({
            where: { id: validatedData.poId },
            data: { status: 'Partially Received' },
          });
        }

        // Update inventory for each item received
        if (mappedItems.length > 0) {
          console.log("CREATING GATE ENTRY ITEMS AND UPDATING INVENTORY", mappedItems);
          for (const item of mappedItems) {
            if (item.materialId) {
              const material = await tx.rawMaterial.findUnique({
                where: { id: item.materialId }
              });

              if (material) {
                const previousStock = material.currentStock;
                const currentStock = previousStock + item.quantityReceived;

                await tx.rawMaterial.update({
                  where: { id: material.id },
                  data: { currentStock }
                });

                // Record transaction
                await tx.inventoryTransaction.create({
                  data: {
                    itemCode: material.code || item.materialCode,
                    itemName: material.name || item.materialName,
                    itemType: 'Raw Material',
                    rawMaterialId: material.id,
                    warehouseId: validatedData.warehouseId || material.warehouseId,
                    quantity: item.quantityReceived,
                    previousStock,
                    currentStock,
                    transactionType: 'Stock In',
                    referenceNumber: gateEntryNumber,
                    remarks: `Received via Gate Entry ${gateEntryNumber}`,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString()
                  }
                });

                // Update StockLevel
                const warehouseId = validatedData.warehouseId || material.warehouseId;
                if (warehouseId) {
                  const existingSL = await tx.stockLevel.findFirst({
                    where: {
                      itemType: 'RAW_MATERIAL',
                      rawMaterialId: material.id,
                      warehouseId: warehouseId,
                    },
                  });

                  if (existingSL) {
                    await tx.stockLevel.update({
                      where: { id: existingSL.id },
                      data: { currentStock: existingSL.currentStock + item.quantityReceived },
                    });
                  } else {
                    await tx.stockLevel.create({
                      data: {
                        itemType: 'RAW_MATERIAL',
                        rawMaterialId: material.id,
                        warehouseId: warehouseId,
                        currentStock: item.quantityReceived,
                      },
                    });
                  }
                }
              }
            }
          }
        }

        await tx.auditLog.create({
          data: {
            action: 'GATE_ENTRY_CREATED',
            module: 'Procurement',
            entity: 'GateEntry',
            entityId: entry.id,
            details: `Recorded Gate Entry ${entry.gateEntryNumber} for vehicle ${entry.vehicleNumber || 'N/A'}`,
          },
        });

        console.log("GATE ENTRY CREATED", entry);
        return entry;
      });

      console.log("GATE ENTRY TRANSACTION SUCCESS");
      return result;
    } catch (error) {
      console.error("GATE ENTRY DATABASE ERROR", error);
      throw error;
    }
  }

  static async update(id: string, data: any) {
    const { items, ...entryData } = data;

    return prisma.$transaction(async (tx) => {
      if (items) {
        await tx.gateEntryItem.deleteMany({ where: { gateEntryId: id } });
      }

      const updated = await tx.gateEntry.update({
        where: { id },
        data: {
          ...entryData,
          items: items?.length ? { create: items } : undefined,
        },
        include: { items: true },
      });

      return updated;
    });
  }
}
