import type { GetProducts, GetCoupon } from "wasp/server/operations";
import type { Product, Coupon } from "wasp/entities";
import { HttpError } from "wasp/server";

export const getProducts: GetProducts<void, Product[]> = async (_args, context) => {
  return context.entities.Product.findMany({
    orderBy: { id: "asc" },
  });
};

export const getCoupon: GetCoupon<{ code: string }, Coupon> = async (args, context) => {
  if (!args.code) {
    throw new HttpError(400, "Coupon code is required");
  }
  const coupon = await context.entities.Coupon.findUnique({
    where: { code: args.code },
  });
  if (!coupon) {
    throw new HttpError(404, "Invalid coupon code");
  }
  return coupon;
};
