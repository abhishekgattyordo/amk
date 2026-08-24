import { z } from 'zod';

export const createSupplierSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  millName: z.string().min(1, 'Mill name is required'),
  category: z.string().min(1, 'Category is required'),
});

export const updateSupplierSchema = createSupplierSchema.partial();
