import { prisma } from '../lib/prisma';

export class CategoryService {
  static async getAll(query?: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: { subCategories: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return { categories, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });
  }

  static async create(data: any) {
    return prisma.category.create({
      data,
    });
  }

  static async update(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.category.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' },
    });
  }
}
