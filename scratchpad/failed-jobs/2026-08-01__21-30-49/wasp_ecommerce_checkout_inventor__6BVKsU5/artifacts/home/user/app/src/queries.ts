import { prisma } from 'wasp/server';

export const getProducts = async (args: any, context: any) => {
  return prisma.product.findMany({
    orderBy: { id: 'asc' },
  });
};

export const getCoupons = async (args: any, context: any) => {
  return prisma.coupon.findMany({
    orderBy: { id: 'asc' },
  });
};
