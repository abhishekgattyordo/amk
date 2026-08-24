import { z } from 'zod';

export const poItemSchema = z.object({
  materialCode: z.string().min(1, 'Material code required'),
  materialName: z.string().min(1, 'Material name required'),
  quantityOrdered: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const createPOSchema = z.object({
  poNumber: z.string().optional(),
  rfqNumber: z.string().optional(),
  rfqId: z.string().optional(),
  quoteId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID required'),
  date: z.string(),
  deliveryDate: z.string(),
  status: z.enum([
    'Draft',
    'Submitted',
    'Pending Approval',
    'Approved',
    'Rejected',
    'Sent to Supplier',
    'Confirmed',
    'Partially Received',
    'Completed',
    'Cancelled',
  ]).optional().default('Draft'),
  remarks: z.string().optional(),
  totalAmount: z.number().nonnegative().optional().default(0),
  items: z.array(poItemSchema).min(1, 'At least one item required'),
});

export const updatePOSchema = createPOSchema.partial();
