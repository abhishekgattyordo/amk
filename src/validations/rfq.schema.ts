import { z } from 'zod';

export const rfqMaterialSchema = z.object({
  materialCode: z.string().min(1, 'Material code required'),
  name: z.string().min(1, 'Material name required'),
  unit: z.string().default('Kg'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  expectedPrice: z.number().optional(),
  requiredDate: z.string(),
  description: z.string().optional(),
  remarks: z.string().optional(),
});

export const rfqSupplierSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID required'),
  supplierName: z.string(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const createRFQSchema = z.object({
  rfqNumber: z.string().optional(),
  rfqDate: z.string(),
  deliveryDate: z.string(),
  department: z.string().optional().default('Procurement'),
  priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
  status: z.enum(['Draft', 'Sent', 'Submitted', 'Awarded', 'Cancelled']).optional().default('Draft'),
  description: z.string().optional(),
  remarks: z.string().optional(),
  materials: z.array(rfqMaterialSchema).optional().default([]),
  suppliers: z.array(rfqSupplierSchema).optional().default([]),
  responseDeadline: z.string().optional(),
});

export const updateRFQSchema = createRFQSchema.partial();
