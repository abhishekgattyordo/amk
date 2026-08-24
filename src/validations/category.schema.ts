import { z } from 'zod';

export const createCategorySchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['Raw Material', 'Finished Product', 'Material Group']).optional(),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSubcategorySchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Subcategory name is required'),
  categoryId: z.string().min(1, 'Parent category ID is required'),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();
