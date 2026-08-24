import { prisma } from '../lib/prisma';

export class QualityCheckService {
  static async getAll(query?: { referenceType?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.referenceType) where.referenceType = query.referenceType;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { qcNumber: { contains: query.search, mode: 'insensitive' } },
        { inspector: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [checks, total] = await Promise.all([
      prisma.qualityCheck.findMany({
        where,
        include: { 
          gateEntry: { include: { items: true } }, 
          reelInward: { include: { items: true, supplier: true } } 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.qualityCheck.count({ where }),
    ]);

    return { checks, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.qualityCheck.findUnique({
      where: { id },
      include: { 
        gateEntry: { include: { items: true } }, 
        reelInward: { include: { items: true, supplier: true } } 
      },
    });
  }

  static async create(data: any) {
    return this.processQcInspection(null, data);
  }

  static async update(id: string, data: any) {
    return this.processQcInspection(id, data);
  }

  private static async processQcInspection(existingQcId: string | null, data: any) {
    const qcNumber = data.qcNumber || `QC-${Date.now().toString().slice(-6)}`;

    const qcData = {
      referenceType: data.referenceType || 'Reel Inward',
      gateEntryId: data.gateEntryId || null,
      reelInwardId: data.reelInwardId || null,
      inspector: data.inspector || 'Sunita Menon',
      status: data.status || 'Pending QC',
      remarks: data.remarks || '',
      testedAt: data.testedAt ? new Date(data.testedAt) : new Date(),
    };

    let inspectionItems: any[] = [];
    try {
      inspectionItems = typeof data.parameters === 'string' 
        ? JSON.parse(data.parameters) 
        : (data.parameters || []);
    } catch (e) {
      inspectionItems = [];
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        let dbReelInward: any = null;

        // 1. Validate Reel Inward if provided
        if (qcData.reelInwardId) {
          dbReelInward = await tx.reelInward.findUnique({
            where: { id: qcData.reelInwardId },
            include: { items: true, supplier: true }
          });
          if (!dbReelInward) {
            throw new Error(`Reel Inward not found: ${qcData.reelInwardId}`);
          }
        }

        // 2. Create or Update QualityCheck record
        let qc: any = null;
        if (existingQcId) {
          qc = await tx.qualityCheck.update({
            where: { id: existingQcId },
            data: {
              referenceType: qcData.referenceType,
              gateEntryId: qcData.gateEntryId,
              reelInwardId: qcData.reelInwardId,
              inspector: qcData.inspector,
              status: qcData.status,
              remarks: qcData.remarks,
              testedAt: qcData.testedAt,
              parameters: JSON.stringify(inspectionItems),
            },
            include: { gateEntry: { include: { items: true } }, reelInward: true },
          });
        } else {
          // Check if QC with same qcNumber already exists
          const existingByQcNumber = await tx.qualityCheck.findUnique({
            where: { qcNumber }
          });

          if (existingByQcNumber) {
            qc = await tx.qualityCheck.update({
              where: { id: existingByQcNumber.id },
              data: {
                referenceType: qcData.referenceType,
                gateEntryId: qcData.gateEntryId,
                reelInwardId: qcData.reelInwardId,
                inspector: qcData.inspector,
                status: qcData.status,
                remarks: qcData.remarks,
                testedAt: qcData.testedAt,
                parameters: JSON.stringify(inspectionItems),
              },
              include: { gateEntry: { include: { items: true } }, reelInward: true },
            });
          } else {
            qc = await tx.qualityCheck.create({
              data: {
                qcNumber,
                referenceType: qcData.referenceType,
                gateEntryId: qcData.gateEntryId,
                reelInwardId: qcData.reelInwardId,
                inspector: qcData.inspector,
                status: qcData.status,
                remarks: qcData.remarks,
                testedAt: qcData.testedAt,
                parameters: JSON.stringify(inspectionItems),
              },
              include: { gateEntry: { include: { items: true } }, reelInward: true },
            });
          }
        }

        // 3. Process Reel Inward Items and Idempotent Stock In/Out
        if (dbReelInward) {
          const inwardItems = dbReelInward.items || [];
          const inwardIdentifier = dbReelInward.inwardNumber || dbReelInward.reelNumber || dbReelInward.id;

          // Resolve Target Warehouse
          let targetWarehouse = await tx.warehouse.findFirst({
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' }
          });

          // Fetch all existing QC transactions for this Reel Inward to compute idempotent deltas
          const existingInwardTransactions = await tx.inventoryTransaction.findMany({
            where: {
              referenceType: 'Reel Inward QC',
              OR: [
                { remarks: { contains: `ReelInwardId: ${dbReelInward.id}` } },
                { remarks: { contains: `Inward: ${inwardIdentifier}` } },
                { remarks: { contains: `Reel:` } },
                { referenceNumber: { not: null } },
              ]
            }
          });

          for (const row of inspectionItems) {
            const rowReelNo = (row.reelNo || row.reelNumber || '').trim();
            if (!rowReelNo) continue;

            // Find or link ReelInwardItem
            let matchedItem = inwardItems.find(
              (it: any) => it.reelNumber.trim().toUpperCase() === rowReelNo.toUpperCase()
            );

            if (!matchedItem) {
              matchedItem = await tx.reelInwardItem.findFirst({
                where: { reelInwardId: dbReelInward.id, reelNumber: rowReelNo }
              });
            }

            const isPassed = 
              row.result === 'Passed' || 
              row.result === 'PASSED' || 
              row.result === 'Approved' || 
              row.result === 'APPROVED';

            const isFailed = 
              row.result === 'Failed' || 
              row.result === 'FAILED' || 
              row.result === 'Rejected' || 
              row.result === 'REJECTED';

            const itemQcStatus = isPassed ? 'Approved' : (isFailed ? 'Rejected' : 'Pending');
            const itemStatusText = isPassed ? 'PASSED' : (isFailed ? 'FAILED' : 'Pending QC');

            const itemWeight = row.netWeight ? Number(row.netWeight) : (matchedItem?.weight || 0);
            const itemGsm = row.observationGsm ? Number(row.observationGsm) : (row.gsm ? Number(row.gsm) : matchedItem?.gsm);
            const itemBf = row.observationBf ? Number(row.observationBf) : (row.bf ? Number(row.bf) : matchedItem?.bf);

            // Update or Create ReelInwardItem
            if (matchedItem) {
              await tx.reelInwardItem.update({
                where: { id: matchedItem.id },
                data: {
                  qcStatus: itemQcStatus,
                  status: itemStatusText,
                  gsm: itemGsm || matchedItem.gsm,
                  bf: itemBf || matchedItem.bf,
                  weight: itemWeight > 0 ? itemWeight : matchedItem.weight,
                  remarks: row.remarks || row.observation || matchedItem.remarks,
                }
              });
            } else {
              matchedItem = await tx.reelInwardItem.create({
                data: {
                  reelInwardId: dbReelInward.id,
                  reelNumber: rowReelNo,
                  material: row.material || dbReelInward.description || 'Paper Reel',
                  weight: itemWeight,
                  gsm: itemGsm,
                  bf: itemBf,
                  uom: 'Kg',
                  qcStatus: itemQcStatus,
                  status: itemStatusText,
                  remarks: row.remarks || null,
                }
              });
            }

            // Resolve matching RawMaterial
            const targetGsm = itemGsm || dbReelInward.gsm;
            let rawMat = await tx.rawMaterial.findFirst({
              where: {
                isDeleted: false,
                OR: [
                  targetGsm ? { gsm: Number(targetGsm) } : undefined,
                  { name: { contains: 'Kraft', mode: 'insensitive' } },
                  { name: { contains: 'Paper', mode: 'insensitive' } },
                  { category: { contains: 'Paper', mode: 'insensitive' } },
                  { category: { contains: 'Kraft', mode: 'insensitive' } },
                ].filter(Boolean) as any
              },
              orderBy: { createdAt: 'asc' }
            });

            if (!rawMat) {
              rawMat = await tx.rawMaterial.findFirst({
                where: { isDeleted: false },
                orderBy: { createdAt: 'asc' }
              });
            }

            if (!rawMat) {
              rawMat = await tx.rawMaterial.create({
                data: {
                  code: `RM-KP-${targetGsm || 180}GSM`,
                  name: `Kraft Paper Reel ${targetGsm || 180} GSM`,
                  category: 'Kraft Paper & Reels',
                  subCategory: `Kraft Liner ${targetGsm || 180} GSM`,
                  gsm: Number(targetGsm || 180),
                  uom: 'Kg',
                  warehouseId: targetWarehouse.id,
                  currentStock: 0,
                  status: 'Active',
                  description: 'Kraft paper reel raw material for production',
                }
              });
            }

            // Use rawMat warehouse if set, otherwise targetWarehouse
            const warehouseIdToUse = row.warehouseId || data.warehouseId || rawMat.warehouseId || targetWarehouse.id;

            // Resolve target bin location for passed reel
            let resolvedBin: any = null;
            if (row.binId) {
              resolvedBin = await tx.binLocation.findFirst({
                where: { id: row.binId }
              });
            }
            if (!resolvedBin) {
              resolvedBin = await tx.binLocation.findFirst({
                where: { warehouseId: warehouseIdToUse, status: 'Active' }
              });
            }
            if (!resolvedBin) {
              // Create default storage bin for this warehouse if none exists
              const binCount = await tx.binLocation.count({ where: { warehouseId: warehouseIdToUse } });
              const defaultCode = `BIN-${Math.floor(100 + Math.random() * 900)}`;
              resolvedBin = await tx.binLocation.create({
                data: {
                  code: defaultCode,
                  name: `Storage Bay ${binCount + 1}`,
                  warehouseId: warehouseIdToUse,
                  type: 'Storage',
                  status: 'Active',
                }
              });
              await tx.warehouse.update({
                where: { id: warehouseIdToUse },
                data: { totalBins: { increment: 1 } }
              }).catch(() => {});
            }

            const targetBinId = resolvedBin ? resolvedBin.id : null;
            row.binId = targetBinId;
            row.binCode = resolvedBin?.code;
            row.binName = resolvedBin?.name;
            row.warehouseId = warehouseIdToUse;
            row.warehouseName = targetWarehouse.name;

            // Compute currently stocked quantity for this reel in this inward
            const reelTxns = existingInwardTransactions.filter((txn) => {
              const matchesInward = 
                txn.remarks?.includes(`ReelInwardId: ${dbReelInward.id}`) ||
                txn.remarks?.includes(`Inward: ${inwardIdentifier}`) ||
                txn.referenceNumber === `${inwardIdentifier}:${rowReelNo}`;

              const matchesReel = 
                txn.referenceNumber === rowReelNo ||
                txn.remarks?.includes(`Reel: ${rowReelNo}`) ||
                txn.reason?.includes(`(${rowReelNo})`) ||
                (matchedItem && txn.remarks?.includes(`ReelItemId: ${matchedItem.id}`));

              return (matchesInward && matchesReel) || (!matchesInward && txn.referenceNumber === rowReelNo);
            });

            const stockInQty = reelTxns
              .filter((t) => t.transactionType === 'QC Release')
              .reduce((sum, t) => sum + (t.quantity || 0), 0);

            const stockOutQty = reelTxns
              .filter((t) => t.transactionType === 'Stock Out' || t.transactionType === 'Stock Adjustment')
              .reduce((sum, t) => sum + (t.quantity || 0), 0);

            const currentlyStockedWeight = Math.max(0, stockInQty - stockOutQty);

            // Calculate target inventory weight for this reel based on verdict
            const targetWeight = isPassed ? (itemWeight > 0 ? itemWeight : (matchedItem?.weight || 0)) : 0;
            const delta = targetWeight - currentlyStockedWeight;

            const now = new Date();
            const formattedDate = now.toISOString().split('T')[0];
            const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

            if (delta > 0) {
              // STOCK IN: Add delta to inventory
              const previousStock = rawMat.currentStock;
              const currentStock = previousStock + delta;

              await tx.rawMaterial.update({
                where: { id: rawMat.id },
                data: { currentStock, warehouseId: warehouseIdToUse }
              });

              // Update or create StockLevel in the specific Bin Location
              const existingStockLevel = await tx.stockLevel.findFirst({
                where: {
                  itemType: 'RAW_MATERIAL',
                  rawMaterialId: rawMat.id,
                  warehouseId: warehouseIdToUse,
                  binId: targetBinId,
                }
              });

              if (existingStockLevel) {
                await tx.stockLevel.update({
                  where: { id: existingStockLevel.id },
                  data: { currentStock: existingStockLevel.currentStock + delta }
                });
              } else {
                await tx.stockLevel.create({
                  data: {
                    itemType: 'RAW_MATERIAL',
                    rawMaterialId: rawMat.id,
                    warehouseId: warehouseIdToUse,
                    binId: targetBinId,
                    currentStock: delta,
                  }
                });
              }

              // Update warehouse active items metric if needed
              await tx.warehouse.update({
                where: { id: warehouseIdToUse },
                data: { updatedAt: new Date() }
              }).catch(() => {});

              // Create Audit-Grade Inventory Transaction with Bin details
              const binDesc = resolvedBin ? `Bin: ${resolvedBin.code} (${resolvedBin.name})` : 'Default Storage';
              await tx.inventoryTransaction.create({
                data: {
                  transactionNumber: `TXN-QC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                  itemCode: rawMat.code || 'RM-KRAFT-CUSTOM',
                  itemName: rawMat.name,
                  itemType: 'Raw Material',
                  rawMaterialId: rawMat.id,
                  warehouseId: warehouseIdToUse,
                  quantity: delta,
                  previousStock,
                  currentStock,
                  transactionType: 'QC Release',
                  user: qcData.inspector || 'Sunita Menon',
                  date: formattedDate,
                  time: formattedTime,
                  reason: `Approved Reel QC Inspection for Reel ${rowReelNo} (Stored in ${binDesc})`,
                  remarks: `Reel: ${rowReelNo} | UOM: ${rawMat.uom || 'Kg'} | Stored in ${binDesc} | Inward: ${inwardIdentifier} | ReelInwardId: ${dbReelInward.id} | ReelItemId: ${matchedItem?.id || ''} | QC: ${qc.qcNumber} | Warehouse: ${targetWarehouse.name}`,
                  referenceNumber: rowReelNo,
                  referenceType: 'Reel Inward QC',
                }
              });
            } else if (delta < 0) {
              // STOCK OUT / REVERSAL: Subtract delta from inventory
              const qtyToDeduct = Math.abs(delta);
              const previousStock = rawMat.currentStock;
              const currentStock = Math.max(0, previousStock - qtyToDeduct);

              await tx.rawMaterial.update({
                where: { id: rawMat.id },
                data: { currentStock }
              });

              const existingStockLevel = await tx.stockLevel.findFirst({
                where: {
                  itemType: 'RAW_MATERIAL',
                  rawMaterialId: rawMat.id,
                  warehouseId: warehouseIdToUse,
                  binId: targetBinId,
                }
              });

              if (existingStockLevel) {
                await tx.stockLevel.update({
                  where: { id: existingStockLevel.id },
                  data: { currentStock: Math.max(0, existingStockLevel.currentStock - qtyToDeduct) }
                });
              }

              const binDesc = resolvedBin ? `Bin: ${resolvedBin.code} (${resolvedBin.name})` : 'Default Storage';
              await tx.inventoryTransaction.create({
                data: {
                  transactionNumber: `TXN-QC-REV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                  itemCode: rawMat.code || 'RM-KRAFT-CUSTOM',
                  itemName: rawMat.name,
                  itemType: 'Raw Material',
                  rawMaterialId: rawMat.id,
                  warehouseId: warehouseIdToUse,
                  quantity: qtyToDeduct,
                  previousStock,
                  currentStock,
                  transactionType: 'Stock Out',
                  user: qcData.inspector || 'Sunita Menon',
                  date: formattedDate,
                  time: formattedTime,
                  reason: `QC Reversal - Reel ${rowReelNo} Marked Failed (Deducted from ${binDesc})`,
                  remarks: `Reel: ${rowReelNo} | UOM: ${rawMat.uom || 'Kg'} | Bin: ${binDesc} | Inward: ${inwardIdentifier} | ReelInwardId: ${dbReelInward.id} | ReelItemId: ${matchedItem?.id || ''} | QC: ${qc.qcNumber} | Warehouse: ${targetWarehouse.name} | Status: Reversed`,
                  referenceNumber: rowReelNo,
                  referenceType: 'Reel Inward QC',
                }
              });
            }
            // If delta === 0: exact same stock status already recorded, perfectly idempotent!
          }

          // 4. Calculate authoritative overall status across all ReelInwardItems
          const updatedItems = await tx.reelInwardItem.findMany({
            where: { reelInwardId: dbReelInward.id }
          });

          const totalCount = updatedItems.length > 0 ? updatedItems.length : inspectionItems.length;
          const passedCount = updatedItems.filter(it => it.qcStatus === 'Approved' || it.status === 'PASSED').length;
          const failedCount = updatedItems.filter(it => it.qcStatus === 'Rejected' || it.status === 'FAILED').length;
          const pendingCount = totalCount - (passedCount + failedCount);

          let overallStatus = 'PENDING QC';
          let overallQcStatus = 'Pending';

          if (totalCount > 0) {
            if (pendingCount > 0) {
              overallStatus = 'PENDING QC';
              overallQcStatus = 'Pending';
            } else if (passedCount === totalCount) {
              overallStatus = 'QC PASSED';
              overallQcStatus = 'Approved';
            } else if (failedCount === totalCount) {
              overallStatus = 'QC FAILED';
              overallQcStatus = 'Rejected';
            } else {
              overallStatus = 'PARTIALLY PASSED';
              overallQcStatus = 'Partially Approved';
            }
          }

          // Update Reel Inward header record
          await tx.reelInward.update({
            where: { id: dbReelInward.id },
            data: {
              status: overallStatus,
              qcStatus: overallQcStatus,
            }
          });

          // Update QualityCheck record with authoritative overall status and resolved bin parameters
          await tx.qualityCheck.update({
            where: { id: qc.id },
            data: { 
              status: overallStatus,
              parameters: JSON.stringify(inspectionItems),
            }
          });

          // Create Single Logical Audit Log
          await tx.auditLog.create({
            data: {
              action: 'QUALITY_CHECK_RECORDED',
              module: 'Quality',
              entity: 'ReelInward',
              entityId: dbReelInward.id,
              user: qcData.inspector || 'Sunita Menon',
              details: `Recorded Quality Check ${qc.qcNumber} for Reel Inward ${inwardIdentifier}: ${passedCount} Passed, ${failedCount} Failed, ${pendingCount} Pending out of ${totalCount} reels. Overall Status: ${overallStatus}.`,
            },
          });
        } else {
          // Gate Entry or generic QC
          if (qcData.gateEntryId) {
            await tx.gateEntry.update({
              where: { id: qcData.gateEntryId },
              data: { status: qcData.status === 'Passed' || qcData.status === 'Approved' ? 'QC Approved' : 'QC Rejected' }
            });
          }

          await tx.auditLog.create({
            data: {
              action: 'QUALITY_CHECK_CREATED',
              module: 'Quality',
              entity: 'QualityCheck',
              entityId: qc.id,
              user: qcData.inspector || 'Sunita Menon',
              details: `Recorded Quality Check ${qc.qcNumber} with status ${qc.status}`,
            },
          });
        }

        return qc;
      });

      return result;
    } catch (error) {
      console.error("QUALITY CHECK API ERROR", error);
      throw error;
    }
  }
}


