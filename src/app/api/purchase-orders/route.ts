import { NextRequest } from 'next/server';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';
import { createPOSchema, updatePOSchema } from '../../../validations/purchase-order.schema';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_po:view')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Purchase Orders', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const po = await PurchaseOrderService.getById(id);
      if (!po) return errorResponse('Purchase Order not found', 404);
      return successResponse(po);
    }

    const supplierId = searchParams.get('supplierId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { pos, total } = await PurchaseOrderService.getAll({ supplierId, status, search, page, limit });
    return paginatedResponse(pos, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_po:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Create Purchase Orders', 403);
    }

    const body = await req.json();
    const validated = createPOSchema.parse(body);
    const po = await PurchaseOrderService.create(validated);

    // Create PO notification if status is Pending Approval
    if (po && po.status === 'Pending Approval') {
      try {
        const approverUsers = await prisma.user.findMany({
          where: {
            isDeleted: false,
            deletedAt: null,
            OR: [
              {
                role: {
                  permissions: {
                    some: {
                      name: {
                        in: ['all:write', 'procurement:write', 'procurement_po:edit', 'procurement_po:approve']
                      }
                    }
                  }
                }
              },
              {
                role: {
                  name: {
                    in: ['Administrator', 'Purchase Manager', 'Procurement Manager', 'Store Manager']
                  }
                }
              }
            ]
          },
          include: {
            role: true
          }
        });

        for (const targetUser of approverUsers) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: targetUser.id,
              entityId: po.id,
              module: 'Procurement'
            }
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                title: 'Purchase Order Approval Needed',
                message: `Purchase Order ${po.poNumber} is waiting for your approval.`,
                time: 'Just now',
                type: 'warning',
                priority: 'Warning',
                read: false,
                module: 'Procurement',
                recipientRole: targetUser.role?.name || 'Manager',
                userId: targetUser.id,
                entityId: po.id,
                entityType: 'po'
              }
            });
          }
        }
      } catch (notifErr) {
        console.error('Failed to create purchase order notifications:', notifErr);
      }
    }

    return successResponse(po, 'Purchase Order created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_po:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions to Edit Purchase Orders', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Purchase Order ID required', 400);

    const body = await req.json();
    const validated = updatePOSchema.parse(body);
    const po = await PurchaseOrderService.update(id, validated);

    // Create PO notification if status is Pending Approval
    if (po && po.status === 'Pending Approval') {
      try {
        const approverUsers = await prisma.user.findMany({
          where: {
            isDeleted: false,
            deletedAt: null,
            OR: [
              {
                role: {
                  permissions: {
                    some: {
                      name: {
                        in: ['all:write', 'procurement:write', 'procurement_po:edit', 'procurement_po:approve']
                      }
                    }
                  }
                }
              },
              {
                role: {
                  name: {
                    in: ['Administrator', 'Purchase Manager', 'Procurement Manager', 'Store Manager']
                  }
                }
              }
            ]
          },
          include: {
            role: true
          }
        });

        for (const targetUser of approverUsers) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: targetUser.id,
              entityId: po.id,
              module: 'Procurement'
            }
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                title: 'Purchase Order Approval Needed',
                message: `Purchase Order ${po.poNumber} is waiting for your approval.`,
                time: 'Just now',
                type: 'warning',
                priority: 'Warning',
                read: false,
                module: 'Procurement',
                recipientRole: targetUser.role?.name || 'Manager',
                userId: targetUser.id,
                entityId: po.id,
                entityType: 'po'
              }
            });
          }
        }
      } catch (notifErr) {
        console.error('Failed to create purchase order notifications:', notifErr);
      }
    }

    return successResponse(po, 'Purchase Order updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_po:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions to Delete Purchase Orders', 403);
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('Purchase Order ID required', 400);

    await PurchaseOrderService.delete(id, user?.id, user?.name);
    return successResponse(null, 'Purchase Order deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
