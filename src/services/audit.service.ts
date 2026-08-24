import { prisma } from '../lib/prisma';

export class AuditService {
  /**
   * Compares two objects and creates audit log entries for changed fields.
   * @param entity 'Product' | 'RawMaterial'
   * @param entityId The ID of the record
   * @param oldData The original record data
   * @param newData The updated record data
   * @param userId The ID of the user performing the update
   * @param userName The name of the user performing the update
   */
  static async logChanges(
    entity: 'Product' | 'RawMaterial',
    entityId: string,
    oldData: any,
    newData: any,
    userId: string | undefined,
    userName: string | undefined
  ) {
    const fieldsToIgnore = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'warehouse'];
    const fieldNames: string[] = [];
    const oldValues: string[] = [];
    const newValues: string[] = [];

    // Filter out complex objects and only compare primitive values
    for (const key in newData) {
      if (fieldsToIgnore.includes(key)) continue;

      const oldValue = oldData[key];
      const newValue = newData[key];

      // Deep comparison for simple types (strings, numbers, booleans)
      if (oldValue !== newValue && (typeof newValue !== 'object' || newValue === null)) {
        fieldNames.push(key);
        oldValues.push(`${key}: ${oldValue?.toString() || 'N/A'}`);
        newValues.push(`${key}: ${newValue?.toString() || 'N/A'}`);
      }
    }

    if (fieldNames.length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'Update',
          entity,
          entityId,
          fieldName: fieldNames.join(', '),
          oldValue: oldValues.join('; '),
          newValue: newValues.join('; '),
          userId,
          user: userName,
          timestamp: new Date(),
        },
      });
    }
  }

  static async logCreate(
    entity: 'Product' | 'RawMaterial',
    entityId: string,
    data: any,
    userId: string | undefined,
    userName: string | undefined
  ) {
    await prisma.auditLog.create({
      data: {
        action: 'Create',
        entity,
        entityId,
        details: 'Record created',
        userId,
        user: userName,
        timestamp: new Date(),
      },
    });
  }

  static async logAction(
    action: string,
    entity: string,
    entityId: string,
    details: string,
    userId: string | undefined,
    userName: string | undefined
  ) {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        userId,
        user: userName,
        timestamp: new Date(),
      },
    });
  }

  static async getHistory(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
