import { prisma } from "wasp/server";
import { HttpError } from "wasp/server";
import type { Checkout } from "wasp/server/operations";

export const checkout: Checkout<{
  items: { productId: number; quantity: number }[];
  couponCode?: string;
}, { orderId: number }> = async (args, context) => {
  const { items, couponCode } = args;

  if (!items || items.length === 0) {
    throw new HttpError(400, "Cart is empty");
  }

  // To prevent deadlocks, sort items by productId ascending
  const sortedItems = [...items].sort((a, b) => a.productId - b.productId);

  try {
    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const itemsToCreate: { productId: number; quantity: number; price: number }[] = [];

      // 1. Acquire row-level locks on products in sorted order and validate inventory
      for (const item of sortedItems) {
        if (item.quantity <= 0) {
          throw new HttpError(400, "Invalid quantity");
        }

        // SELECT ... FOR UPDATE locks the product row in PostgreSQL
        const products = await tx.$queryRaw<any[]>`
          SELECT id, name, price, inventory FROM "Product" 
          WHERE id = ${item.productId} 
          FOR UPDATE
        `;

        const product = products[0];
        if (!product) {
          throw new HttpError(404, `Product with ID ${item.productId} not found`);
        }

        if (product.inventory < item.quantity) {
          throw new HttpError(400, "Insufficient inventory");
        }

        // Decrement the inventory
        const updatedInventory = product.inventory - item.quantity;
        await tx.$executeRaw`
          UPDATE "Product" 
          SET inventory = ${updatedInventory} 
          WHERE id = ${item.productId}
        `;

        const itemPrice = product.price;
        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;

        itemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
          price: itemPrice,
        });
      }

      // 2. Validate and apply coupon if provided
      let discount = 0;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode },
        });

        if (!coupon) {
          throw new HttpError(400, "Invalid coupon code");
        }

        if (coupon.type === "PERCENT") {
          discount = subtotal * (coupon.value / 100);
        } else if (coupon.type === "FLAT") {
          discount = coupon.value;
        }
      }

      // Grand total cannot go below $0.00
      const total = Math.max(0, subtotal - discount);

      // 3. Create the Order and OrderItems
      const order = await tx.order.create({
        data: {
          total,
          discount,
          items: {
            create: itemsToCreate,
          },
        },
      });

      return order;
    }, {
      // Use a short timeout for checkout transactions to fail fast if there's high contention
      timeout: 10000,
    });

    return { orderId: orderResult.id };
  } catch (error: any) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(error.status || 500, error.message || "Checkout failed");
  }
};
