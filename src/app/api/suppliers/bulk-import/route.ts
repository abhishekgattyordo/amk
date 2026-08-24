import { NextRequest } from 'next/server';
import { SupplierService } from '../../../../services/supplier.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { createSupplierSchema } from '../../../../validations/supplier.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const suppliersToImport = body.suppliers; // Expecting { suppliers: [...] }
    
    if (!Array.isArray(suppliersToImport)) {
        return errorResponse('Invalid input, expected an array of suppliers', 400);
    }

    const results = {
        imported: 0,
        failed: 0,
        duplicates: 0,
        errors: [] as any[]
    };

    for (const supplierData of suppliersToImport) {
        try {
            // Check for duplicates (supplierName, millName, and category)
            const existing = await SupplierService.findDuplicate(supplierData.supplierName, supplierData.millName, supplierData.category);
            if (existing) {
                results.duplicates++;
                continue;
            }

            const validated = createSupplierSchema.parse(supplierData);
            await SupplierService.create(validated);
            results.imported++;
        } catch (err: any) {
            results.failed++;
            results.errors.push({ supplier: supplierData.supplierName, error: err.message });
        }
    }

    return successResponse(results, 'Bulk import completed');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
