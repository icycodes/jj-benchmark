import { prisma } from "wasp/server";
import { HttpError } from "wasp/server";

export const fulfillOrder = async (args: { orderId: number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }

  const { orderId } = args;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the order with its items.
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpError(404, `Order with ID ${orderId} not found.`);
    }

    if (order.status === "FULFILLED") {
      throw new HttpError(400, "Order is already fulfilled.");
    }

    // 2. For each item, check if the product has sufficient stock.
    for (const item of order.orderItems) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new HttpError(404, `Product with ID ${item.productId} not found.`);
      }

      if (product.stock < item.quantity) {
        throw new HttpError(
          400,
          `Insufficient stock for product ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}.`
        );
      }
    }

    // 3. Decrement stock, check threshold, and create alerts/POs
    for (const item of order.orderItems) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new HttpError(404, `Product with ID ${item.productId} not found.`);
      }

      const newStock = product.stock - item.quantity;

      // Update product stock
      await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock },
      });

      // 4. Check if the new stock level is strictly less than lowStockThreshold
      if (newStock < product.lowStockThreshold) {
        // Create an Alert record
        const alertMessage = `Low stock alert for ${product.name} (SKU: ${product.sku}). Current stock: ${newStock}.`;
        await tx.alert.create({
          data: {
            productId: product.id,
            message: alertMessage,
          },
        });

        // Check if there is already an existing PurchaseOrder for this product with status "SENT"
        const existingPO = await tx.purchaseOrder.findFirst({
          where: {
            productId: product.id,
            status: "SENT",
          },
        });

        if (!existingPO) {
          // Create a new PurchaseOrder
          await tx.purchaseOrder.create({
            data: {
              supplierId: product.supplierId,
              productId: product.id,
              quantity: product.reorderQuantity,
              status: "SENT",
            },
          });
        }
      }
    }

    // 5. Set the order status to "FULFILLED"
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "FULFILLED" },
    });

    return updatedOrder;
  });
};
