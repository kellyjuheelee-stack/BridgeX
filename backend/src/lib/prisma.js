const { PrismaClient } = require('@prisma/client');

// 단일 PrismaClient 인스턴스 재사용 (개발 중 hot-reload 시 커넥션 누수 방지)
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__bridgexPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__bridgexPrisma = prisma;
}

module.exports = prisma;
