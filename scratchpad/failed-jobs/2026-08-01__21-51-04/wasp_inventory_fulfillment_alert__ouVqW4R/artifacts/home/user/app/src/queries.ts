import { HttpError } from "wasp/server";

export const getProducts = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return context.entities.Product.findMany({
    include: {
      supplier: true,
    },
  });
};

export const getOrders = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return context.entities.Order.findMany({
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getAlerts = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return context.entities.Alert.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getPurchaseOrders = async (_args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return context.entities.PurchaseOrder.findMany({
    include: {
      supplier: true,
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
