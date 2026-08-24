import { NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { successResponse, errorResponse } from '../../../utils/api';
import { getAuthorizedUser } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthorizedUser(req);
    if (!authUser) {
      return errorResponse('Unauthorized: Please log in', 401);
    }

    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(roles, 'Roles fetched successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthorizedUser(req);
    const roleName = authUser?.role?.name || (typeof authUser?.role === 'string' ? authUser?.role : '') || authUser?.roleName || '';
    const isAdmin = roleName === 'Administrator' || roleName === 'Super Admin' || authUser?.email === 'rajesh.sharma@amkerp.com' || authUser?.email === 'admin@amkerp.com';
    if (!authUser || !isAdmin) {
      return errorResponse('Forbidden: Only Administrators can modify roles or permissions', 403);
    }

    const body = await req.json();
    const { action, roleId, name, description, permissionNames, permissions } = body;

    // ACTION: Create custom role
    if (action === 'create') {
      if (!name) {
        return errorResponse('Role name is required', 400);
      }
      
      const existing = await prisma.role.findUnique({
        where: { name: name.trim() },
      });
      if (existing) {
        return errorResponse(`Role "${name}" already exists`, 400);
      }

      const finalPermissions = permissionNames || permissions || [];
      const newRole = await prisma.role.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          permissions: {
            connectOrCreate: finalPermissions.map((pName: string) => ({
              where: { name: pName },
              create: { name: pName },
            })),
          },
        },
        include: {
          permissions: true,
          users: true,
        },
      });

      return successResponse(newRole, 'Role created successfully');
    }

    // ACTION: Update custom role
    if (action === 'update') {
      if (!roleId) {
        return errorResponse('roleId is required', 400);
      }
      if (!name) {
        return errorResponse('Role name is required', 400);
      }

      const existing = await prisma.role.findUnique({
        where: { name: name.trim() },
      });
      if (existing && existing.id !== roleId) {
        return errorResponse(`Another role with name "${name}" already exists`, 400);
      }

      const currentRole = await prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!currentRole) {
        return errorResponse('Role not found', 404);
      }

      if (currentRole.name === 'Administrator' && name.trim() !== 'Administrator') {
        return errorResponse('The Administrator role name cannot be modified', 400);
      }

      const finalPermissions = permissionNames || permissions || [];
      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: {
          name: name.trim(),
          description: description !== undefined ? (description ? description.trim() : null) : undefined,
          permissions: {
            set: [],
            connectOrCreate: finalPermissions.map((pName: string) => ({
              where: { name: pName },
              create: { name: pName },
            })),
          },
        },
        include: {
          permissions: true,
          users: true,
        },
      });

      return successResponse(updatedRole, 'Role updated successfully');
    }

    // ACTION: Delete custom role
    if (action === 'delete') {
      if (!roleId) {
        return errorResponse('roleId is required', 400);
      }

      const currentRole = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          users: {
            where: {
              deletedAt: null
            }
          }
        }
      });

      if (!currentRole) {
        return errorResponse('Role not found', 404);
      }

      const protectedRoles = ['Administrator', 'Super Admin', 'Inventory Manager', 'Purchase Manager'];
      if (protectedRoles.includes(currentRole.name)) {
        return errorResponse(`System protected roles (like ${currentRole.name}) cannot be deleted`, 400);
      }

      const activeUsersCount = currentRole.users.length;
      if (activeUsersCount > 0) {
        return errorResponse(`Cannot delete role. There are currently ${activeUsersCount} active users assigned to this role. Please reassign them before deleting.`, 400);
      }

      await prisma.role.delete({
        where: { id: roleId },
      });

      return successResponse({ id: roleId }, 'Role deleted successfully');
    }

    // Default action: backward compatible permission-only update
    const finalPermissions = permissions || permissionNames;
    if (!roleId || !Array.isArray(finalPermissions)) {
      return errorResponse('Missing roleId or permissions array', 400);
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: [],
          connectOrCreate: finalPermissions.map((pName: string) => ({
            where: { name: pName },
            create: { name: pName },
          })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return successResponse(updatedRole, 'Permissions updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 500);
  }
}
