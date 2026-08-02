import { HttpError } from "wasp/server";
import { prisma } from "wasp/server";

export const getProducts = async (_args: any, _context: any) => {
  return prisma.product.findMany({
    orderBy: { id: "asc" },
  });
};

export const validateCoupon = async (args: { code: string }, _context: any) => {
  const { code } = args;
  if (!code) {
    throw new HttpError(400, "Coupon code is required");
  }
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon) {
    throw new HttpError(404, "Invalid coupon code");
  }
  return coupon;
};
