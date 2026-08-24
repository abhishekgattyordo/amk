import { z } from 'zod';

export const createProductSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  boxType: z.string().optional(),
  dimensions: z.string().optional(),
  gsm: z.number().optional(),
  unit: z.string().optional().default('Pcs'),
  uom: z.string().optional().default('NOS'),
  hsnCode: z.string().optional(),
  costPrice: z.number().nonnegative().optional().default(0),
  sellingPrice: z.number().nonnegative().optional().default(0),
  warehouseId: z.string().optional(),
  availableStock: z.number().nonnegative().optional().default(0),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
  imageUrl: z.string().optional(),
  specifications: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();
