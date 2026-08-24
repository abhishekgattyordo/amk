import { z } from 'zod';

export const stockInSchema = z.object({
  materialId: z.string().optional(),
  productId: z.string().optional(),
  warehouseId: z.string().min(1, 'Warehouse ID required'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().optional(),
  remarks: z.string().optional(),
  referenceNumber: z.string().optional(),
  user: z.string().optional(),
});

export const stockOutSchema = z.object({
  materialId: z.string().optional(),
  productId: z.string().optional(),
  warehouseId: z.string().min(1, 'Warehouse ID required'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().optional(),
  remarks: z.string().optional(),
  referenceNumber: z.string().optional(),
  user: z.string().optional(),
});

export const warehouseTransferSchema = z.object({
  materialId: z.string().optional(),
  productId: z.string().optional(),
  sourceWarehouseId: z.string().min(1, 'Source Warehouse ID required'),
  destinationWarehouseId: z.string().min(1, 'Destination Warehouse ID required'),
  quantity: z.number().positive('Quantity must be positive'),
  remarks: z.string().optional(),
  user: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  itemType: z.enum(['RAW_MATERIAL', 'PRODUCT']),
  itemId: z.string().min(1, 'Item ID required'),
  warehouseId: z.string().optional(),
  quantity: z.number(), // Can be positive (add) or negative (reduce)
  reason: z.string().min(1, 'Reason required'),
  user: z.string().optional(),
});
