import { prisma } from '../lib/prisma';

export class NotificationService {
  static async getAll(query?: { read?: boolean; userId?: string; recipientRole?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof query?.read === 'boolean') where.read = query.read;
    if (query?.userId) where.userId = query.userId;
    if (query?.recipientRole) where.recipientRole = query.recipientRole;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId?: string) {
    const where = userId ? { userId } : {};
    return prisma.notification.updateMany({
      where,
      data: { read: true },
    });
  }

  static async create(data: any) {
    return prisma.notification.create({ data });
  }
}
