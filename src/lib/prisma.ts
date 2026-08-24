import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/amk_erp';
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const poolConfig: any = { 
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    };
    if (!isLocalhost) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    const pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
