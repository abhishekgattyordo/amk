import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/amk_erp';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial database data...');

  // 1. Roles & Permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      permissions: {
        create: [
          { name: 'all:read' },
          { name: 'all:write' },
          { name: 'all:delete' },
        ],
      },
    },
  });

  const invManagerRole = await prisma.role.upsert({
    where: { name: 'Inventory Manager' },
    update: {},
    create: {
      name: 'Inventory Manager',
      permissions: {
        create: [
          { name: 'inventory:read' },
          { name: 'inventory:write' },
        ],
      },
    },
  });

  const purchaseManagerRole = await prisma.role.upsert({
    where: { name: 'Purchase Manager' },
    update: {},
    create: {
      name: 'Purchase Manager',
      permissions: {
        create: [
          { name: 'procurement:read' },
          { name: 'procurement:write' },
        ],
      },
    },
  });

  // 2. Enterprise Users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const rajeshUser = await prisma.user.upsert({
    where: { email: 'rajesh.sharma@amkerp.com' },
    update: {
      name: 'Rajesh Sharma',
      roleId: adminRole.id,
      department: 'Executive Office',
    },
    create: {
      email: 'rajesh.sharma@amkerp.com',
      password: hashedPassword,
      name: 'Rajesh Sharma',
      department: 'Executive Office',
      roleId: adminRole.id,
    },
  });

  const amitUser = await prisma.user.upsert({
    where: { email: 'amit.patel@amkerp.com' },
    update: {
      name: 'Amit Patel',
      roleId: invManagerRole.id,
      department: 'Supply Chain',
    },
    create: {
      email: 'amit.patel@amkerp.com',
      password: hashedPassword,
      name: 'Amit Patel',
      department: 'Supply Chain',
      roleId: invManagerRole.id,
    },
  });

  const sunitaUser = await prisma.user.upsert({
    where: { email: 'sunita.menon@amkerp.com' },
    update: {
      name: 'Sunita Menon',
      roleId: purchaseManagerRole.id,
      department: 'Procurement',
    },
    create: {
      email: 'sunita.menon@amkerp.com',
      password: hashedPassword,
      name: 'Sunita Menon',
      department: 'Procurement',
      roleId: purchaseManagerRole.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@amkerp.com' },
    update: {},
    create: {
      email: 'admin@amkerp.com',
      password: hashedPassword,
      name: 'AMK Admin',
      department: 'Management',
      roleId: adminRole.id,
    },
  });

  // 3. Categories & Subcategories
  let catPaper = await prisma.category.findUnique({ where: { code: 'CAT-KRAFT' } });
  if (!catPaper) {
    catPaper = await prisma.category.create({
      data: {
        code: 'CAT-KRAFT',
        name: 'Kraft Paper & Reels',
        type: 'Raw Material',
        description: 'Kraft paper reels used for corrugated board fluting and liners',
        subCategories: {
          create: [
            { code: 'SUB-KP-180', name: 'Kraft Liner 180 GSM' },
            { code: 'SUB-KP-200', name: 'Kraft Liner 200 GSM' },
            { code: 'SUB-CM-150', name: 'Corrugating Medium 150 GSM' },
          ],
        },
      },
    });
  }

  let catAdhesives = await prisma.category.findUnique({ where: { code: 'CAT-ADH' } });
  if (!catAdhesives) {
    catAdhesives = await prisma.category.create({
      data: {
        code: 'CAT-ADH',
        name: 'Adhesives & Chemicals',
        type: 'Raw Material',
        description: 'Corn starch, caustic soda, borax, waterproofing resins',
        subCategories: {
          create: [
            { code: 'SUB-STARCH', name: 'Corn Starch Powder' },
            { code: 'SUB-BORAX', name: 'Borax Decahydrate' },
          ],
        },
      },
    });
  }

  // 4. Material Group
  let paperGroup = await prisma.materialGroup.findUnique({ where: { code: 'GRP-PAPER' } });
  if (!paperGroup) {
    paperGroup = await prisma.materialGroup.create({
      data: {
        code: 'GRP-PAPER',
        name: 'Paper Reels & Liners',
        description: 'Primary raw material group for corrugated box manufacturing',
      },
    });
  }

  // 5. Suppliers
  let supplier1 = await prisma.supplier.findFirst({ where: { supplierName: 'Century Paper Mills Ltd' } });
  if (!supplier1) {
    supplier1 = await prisma.supplier.create({
      data: {
        supplierName: 'Century Paper Mills Ltd',
        millName: 'Century Mill Unit 1',
        category: 'Paper Reels & Liners'
      },
    });
  }

  let supplier2 = await prisma.supplier.findFirst({ where: { supplierName: 'Star Starch & Chemicals' } });
  if (!supplier2) {
    supplier2 = await prisma.supplier.create({
      data: {
        supplierName: 'Star Starch & Chemicals',
        millName: 'Star Chemical Works',
        category: 'Chemicals & Starch'
      },
    });
  }

  // 6. Warehouses
  let mainWarehouse = await prisma.warehouse.findUnique({ where: { code: 'WH-MAIN' } });
  if (!mainWarehouse) {
    mainWarehouse = await prisma.warehouse.create({
      data: {
        code: 'WH-MAIN',
        name: 'Main Plant Warehouse',
        location: 'Plant Area 1, Factory Complex',
        manager: 'Suresh Kumar',
        capacitySqFt: 25000,
        currentUtilizationPercent: 62,
        totalBins: 120,
        activeItemsCount: 45,
      },
    });
  }

  // 7. Raw Materials
  let rawMat1 = await prisma.rawMaterial.findUnique({ where: { code: 'RM-KP-180BF' } });
  if (!rawMat1) {
    rawMat1 = await prisma.rawMaterial.create({
      data: {
        code: 'RM-KP-180BF',
        name: 'Kraft Liner Paper 180 GSM / 18 BF',
        category: catPaper.name,
        subCategory: 'Kraft Liner 180 GSM',
        groupId: paperGroup.id,
        supplierId: supplier1.id,
        warehouseId: mainWarehouse.id,
        grade: 'BF-18',
        gsm: 180,
        thickness: 0.25,
        uom: 'Kg',
        hsnCode: '48041100',
        currentStock: 15400,
        minStock: 5000,
        maxStock: 30000,
        reorderLevel: 8000,
        purchasePrice: 42.5,
        status: 'Active',
        description: 'Virgin kraft liner paper for outer corrugated box fluting',
      },
    });
  }

  // 8. Finished Products
  let prod1 = await prisma.product.findUnique({ where: { code: 'PROD-RSC-4030' } });
  if (!prod1) {
    prod1 = await prisma.product.create({
      data: {
        code: 'PROD-RSC-4030',
        name: '5-Ply RSC Corrugated Box (400x300x250mm)',
        category: 'Finished Product',
        subCategory: 'RSC Box',
        boxType: 'RSC (Regular Slotted Carton)',
        dimensions: '400 x 300 x 250 mm',
        gsm: 180,
        unit: 'Pcs',
        hsnCode: '48191010',
        costPrice: 28.5,
        sellingPrice: 38.0,
        warehouseId: mainWarehouse.id,
        availableStock: 2500,
        status: 'Active',
        specifications: 'Outer Kraft 180 GSM, Fluting 150 GSM, Inner Liner 180 GSM.',
      },
    });
  }

  // 9. Stock Levels
  const existingStockLevel = await prisma.stockLevel.findFirst({
    where: { rawMaterialId: rawMat1.id, warehouseId: mainWarehouse.id },
  });
  if (!existingStockLevel) {
    await prisma.stockLevel.create({
      data: {
        itemType: 'RAW_MATERIAL',
        rawMaterialId: rawMat1.id,
        warehouseId: mainWarehouse.id,
        currentStock: 15400,
        minStock: 5000,
        maxStock: 30000,
        reorderLevel: 8000,
      },
    });
  }

  // 10. Initial Inventory Transaction
  const existingTxn = await prisma.inventoryTransaction.findUnique({
    where: { transactionNumber: 'TXN-INIT-001' },
  });
  if (!existingTxn) {
    await prisma.inventoryTransaction.create({
      data: {
        transactionNumber: 'TXN-INIT-001',
        itemCode: rawMat1.code,
        itemName: rawMat1.name,
        itemType: 'Raw Material',
        rawMaterialId: rawMat1.id,
        warehouseId: mainWarehouse.id,
        quantity: 15400,
        previousStock: 0,
        currentStock: 15400,
        transactionType: 'Stock In',
        user: adminUser.name,
        date: new Date().toISOString().split('T')[0],
        reason: 'Initial Opening Stock Entry',
      },
    });
  }

  // 11. Notification & Audit Log
  const existingNotif = await prisma.notification.findFirst({
    where: { title: 'Welcome to AMK ERP' },
  });
  if (!existingNotif) {
    await prisma.notification.create({
      data: {
        title: 'Welcome to AMK ERP',
        message: 'System backend & database initialized with Prisma ORM and PostgreSQL.',
        type: 'info',
        priority: 'Info',
        userId: adminUser.id,
      },
    });
  }

  const existingAudit = await prisma.auditLog.findFirst({
    where: { action: 'SYSTEM_INITIALIZED' },
  });
  if (!existingAudit) {
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_INITIALIZED',
        module: 'Admin',
        entity: 'System',
        entityId: 'SYSTEM',
        user: adminUser.name,
        userId: adminUser.id,
        details: JSON.stringify({ message: 'Populated initial database seed records successfully.' }),
      },
    });
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
