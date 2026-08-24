import { prisma } from '../lib/prisma';

export class ReelInwardService {
  static async getAll(query?: {
    poId?: string;
    supplierId?: string;
    qcStatus?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.poId) where.poId = query.poId;
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.qcStatus) where.qcStatus = query.qcStatus;
    if (query?.status) where.status = query.status;

    if (query?.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { inwardNumber: { contains: searchTerm, mode: 'insensitive' } },
        { challanNumber: { contains: searchTerm, mode: 'insensitive' } },
        { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
        { poNumber: { contains: searchTerm, mode: 'insensitive' } },
        { supplierName: { contains: searchTerm, mode: 'insensitive' } },
        { millName: { contains: searchTerm, mode: 'insensitive' } },
        { vehicleNumber: { contains: searchTerm, mode: 'insensitive' } },
        { reelNumber: { contains: searchTerm, mode: 'insensitive' } },
        {
          items: {
            some: {
              reelNumber: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [reels, total] = await Promise.all([
      prisma.reelInward.findMany({
        where,
        include: {
          purchaseOrder: true,
          supplier: true,
          items: {
            orderBy: { createdAt: 'asc' },
          },
          qualityChecks: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reelInward.count({ where }),
    ]);

    return { reels, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.reelInward.findFirst({
      where: {
        OR: [{ id }, { inwardNumber: id }],
        isDeleted: false,
      },
      include: {
        purchaseOrder: true,
        supplier: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
        qualityChecks: true,
      },
    });
  }

  static async create(data: any, user?: { id?: string; name?: string; email?: string }) {
    // If incoming data is an array (legacy batch), process as single challan or multiple items
    const isArray = Array.isArray(data);
    const rawItems = isArray ? data : (data.items || data.reels || [data]);
    const headerData = isArray ? data[0] || {} : data;

    return prisma.$transaction(async (tx) => {
      let poId = headerData.poId || null;
      let supplierId = headerData.supplierId || null;
      let supplierName = headerData.supplierName || headerData.millName || null;

      if (headerData.poNumber && (!poId || !supplierId || !supplierName)) {
        const po = await tx.purchaseOrder.findFirst({
          where: { poNumber: headerData.poNumber },
          include: { supplier: true },
        });
        if (po) {
          poId = po.id;
          supplierId = po.supplierId;
          supplierName = supplierName || (po.supplier as any)?.supplierName || (po.supplier as any)?.millName || null;
        }
      }

      if (supplierId && !supplierName) {
        const sup = await tx.supplier.findUnique({ where: { id: supplierId } });
        if (sup) {
          supplierName = sup.supplierName || sup.millName || null;
        }
      }

      const inwardNumber = headerData.inwardNumber || headerData.referenceNumber || `RIN-${Date.now().toString().slice(-6)}`;
      const challanNumber = headerData.challanNumber || null;
      const invoiceNumber = headerData.invoiceNumber || null;
      const receivedDate = headerData.receivedDate || headerData.arrivalDate || new Date().toISOString().split('T')[0];
      const vehicleNumber = headerData.vehicleNumber || null;
      const description = headerData.description || null;
      const remarks = headerData.remarks || null;

      // Extract and validate items
      const mappedItems: any[] = [];
      const seenReelNumbers = new Set<string>();

      for (let i = 0; i < rawItems.length; i++) {
        const it = rawItems[i];
        if (!it) continue;

        const reelNum = (it.reelNumber || it.reelNo || `R${String(i + 1).padStart(3, '0')}`).trim();
        if (!reelNum) {
          throw new Error(`Reel row #${i + 1} is missing a Reel Number.`);
        }

        if (seenReelNumbers.has(reelNum.toUpperCase())) {
          throw new Error(`Duplicate Reel Number "${reelNum}" found in Reel Inward. Each reel within the Reel Inward must have a unique Reel Number.`);
        }
        seenReelNumbers.add(reelNum.toUpperCase());

        const weight = Number(it.weight || it.weightKg || it.netWeight || 0);
        const gsm = it.gsm ? Number(it.gsm) : null;
        const bf = it.bf ? Number(it.bf) : null;
        const length = it.length ? Number(it.length) : null;
        const breadth = it.breadth !== undefined && it.breadth !== null ? Number(it.breadth) : (it.width ? Number(it.width) : null);
        const size = it.size || (length && breadth ? `${length}x${breadth}` : breadth ? `${breadth}mm` : null);

        mappedItems.push({
          reelNumber: reelNum,
          material: it.material || it.materialName || 'Paper Reel',
          description: it.description || null,
          hsnCode: it.hsnCode || it.hsn || '48191010',
          bf,
          gsm,
          length,
          breadth,
          size,
          weight,
          uom: it.uom || 'Kg',
          lotNumber: it.lotNumber || it.lot || null,
          qcStatus: 'Pending',
          status: 'Pending QC',
          remarks: it.remarks || null,
        });
      }

      if (mappedItems.length === 0) {
        throw new Error('At least one reel must be specified for Reel Inward.');
      }

      const totalWeight = mappedItems.reduce((acc, curr) => acc + curr.weight, 0);

      const created = await tx.reelInward.create({
        data: {
          inwardNumber,
          reelNumber: mappedItems[0]?.reelNumber || null,
          challanNumber,
          invoiceNumber,
          poId,
          poNumber: headerData.poNumber || null,
          supplierId,
          supplierName,
          millName: headerData.millName || supplierName,
          receivedDate,
          vehicleNumber,
          description,
          gsm: mappedItems[0]?.gsm || null,
          bf: mappedItems[0]?.bf || null,
          width: mappedItems[0]?.breadth || null,
          weight: totalWeight,
          qcStatus: 'Pending',
          status: 'PENDING_QC',
          remarks,
          items: {
            create: mappedItems,
          },
        },
        include: {
          supplier: true,
          purchaseOrder: true,
          items: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Single logical audit event for the whole Reel Inward create operation
      const userName = user?.name || user?.email || 'Administrator';
      await tx.auditLog.create({
        data: {
          action: 'REEL_INWARD_CREATED',
          module: 'Procurement',
          entity: 'ReelInward',
          entityId: created.id,
          user: userName,
          userId: user?.id || null,
          details: `Inwarded Reel Inward ${created.inwardNumber} with ${mappedItems.length} reels (${totalWeight} kg). Supplier: ${supplierName || 'N/A'}, Challan: ${challanNumber || 'N/A'}, Invoice: ${invoiceNumber || 'N/A'}. Status: PENDING_QC.`,
        },
      });

      return created;
    });
  }

  static async update(id: string, data: any, user?: { id?: string; name?: string; email?: string }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.reelInward.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error(`Reel Inward record not found: ${id}`);
      }

      const rawItems = data.items || data.reels;
      let mappedItems: any[] | null = null;

      if (rawItems && Array.isArray(rawItems)) {
        const seen = new Set<string>();
        mappedItems = rawItems.map((it: any, i: number) => {
          const reelNum = (it.reelNumber || it.reelNo || `R${String(i + 1).padStart(3, '0')}`).trim();
          if (!reelNum) throw new Error(`Reel row #${i + 1} is missing a Reel Number.`);
          if (seen.has(reelNum.toUpperCase())) {
            throw new Error(`Duplicate Reel Number "${reelNum}" in Reel Inward.`);
          }
          seen.add(reelNum.toUpperCase());

          const weight = Number(it.weight || it.weightKg || it.netWeight || 0);
          const gsm = it.gsm ? Number(it.gsm) : null;
          const bf = it.bf ? Number(it.bf) : null;
          const length = it.length ? Number(it.length) : null;
          const breadth = it.breadth !== undefined && it.breadth !== null ? Number(it.breadth) : (it.width ? Number(it.width) : null);
          const size = it.size || (length && breadth ? `${length}x${breadth}` : breadth ? `${breadth}mm` : null);

          return {
            reelNumber: reelNum,
            material: it.material || it.materialName || 'Paper Reel',
            description: it.description || null,
            hsnCode: it.hsnCode || it.hsn || '48191010',
            bf,
            gsm,
            length,
            breadth,
            size,
            weight,
            uom: it.uom || 'Kg',
            lotNumber: it.lotNumber || it.lot || null,
            qcStatus: it.qcStatus || 'Pending',
            status: it.status || 'Pending QC',
            remarks: it.remarks || null,
          };
        });

        // Delete previous items and re-create
        await tx.reelInwardItem.deleteMany({ where: { reelInwardId: id } });
      }

      const totalWeight = mappedItems
        ? mappedItems.reduce((acc, curr) => acc + curr.weight, 0)
        : (data.weight !== undefined ? Number(data.weight) : existing.weight);

      const updateData: any = {
        inwardNumber: data.inwardNumber !== undefined ? data.inwardNumber : existing.inwardNumber,
        challanNumber: data.challanNumber !== undefined ? data.challanNumber : existing.challanNumber,
        invoiceNumber: data.invoiceNumber !== undefined ? data.invoiceNumber : existing.invoiceNumber,
        poNumber: data.poNumber !== undefined ? data.poNumber : existing.poNumber,
        poId: data.poId !== undefined ? data.poId : existing.poId,
        supplierId: data.supplierId !== undefined ? data.supplierId : existing.supplierId,
        supplierName: data.supplierName !== undefined ? data.supplierName : existing.supplierName,
        millName: data.millName !== undefined ? data.millName : existing.millName,
        receivedDate: data.receivedDate !== undefined ? data.receivedDate : existing.receivedDate,
        vehicleNumber: data.vehicleNumber !== undefined ? data.vehicleNumber : existing.vehicleNumber,
        description: data.description !== undefined ? data.description : existing.description,
        remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
        status: data.status !== undefined ? data.status : existing.status,
        qcStatus: data.qcStatus !== undefined ? data.qcStatus : existing.qcStatus,
        weight: totalWeight,
      };

      if (mappedItems) {
        updateData.items = {
          create: mappedItems,
        };
        updateData.reelNumber = mappedItems[0]?.reelNumber || existing.reelNumber;
        updateData.gsm = mappedItems[0]?.gsm || existing.gsm;
        updateData.bf = mappedItems[0]?.bf || existing.bf;
        updateData.width = mappedItems[0]?.breadth || existing.width;
      }

      const updated = await tx.reelInward.update({
        where: { id },
        data: updateData,
        include: {
          supplier: true,
          purchaseOrder: true,
          items: {
            orderBy: { createdAt: 'asc' },
          },
          qualityChecks: true,
        },
      });

      // Track changed fields in ONE logical audit event
      const changes: string[] = [];
      if (data.challanNumber && data.challanNumber !== existing.challanNumber) changes.push(`Challan Number (${existing.challanNumber} -> ${data.challanNumber})`);
      if (data.invoiceNumber && data.invoiceNumber !== existing.invoiceNumber) changes.push(`Invoice Number (${existing.invoiceNumber} -> ${data.invoiceNumber})`);
      if (data.vehicleNumber && data.vehicleNumber !== existing.vehicleNumber) changes.push(`Vehicle (${existing.vehicleNumber} -> ${data.vehicleNumber})`);
      if (data.status && data.status !== existing.status) changes.push(`Status (${existing.status} -> ${data.status})`);
      if (mappedItems) changes.push(`Reel items count (${existing.items.length} -> ${mappedItems.length})`);

      const userName = user?.name || user?.email || 'Administrator';
      await tx.auditLog.create({
        data: {
          action: 'REEL_INWARD_UPDATED',
          module: 'Procurement',
          entity: 'ReelInward',
          entityId: id,
          user: userName,
          userId: user?.id || null,
          details: `Updated Reel Inward ${updated.inwardNumber || id}. ${changes.length > 0 ? `Changed: ${changes.join(', ')}` : 'Details modified.'}`,
        },
      });

      return updated;
    });
  }

  static async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const userName = user?.name || user?.email || 'Administrator';
    const deleted = await prisma.reelInward.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userName,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'REEL_INWARD_DELETED',
        module: 'Procurement',
        entity: 'ReelInward',
        entityId: id,
        user: userName,
        userId: user?.id || null,
        details: `Deleted Reel Inward ${deleted.inwardNumber || id}`,
      },
    });

    return deleted;
  }
}
