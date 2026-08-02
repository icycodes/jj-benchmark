import { HttpError } from "wasp/server";
import { prisma } from "wasp/server";

interface CheckoutItem {
  productId: number;
  quantity: number;
}

interface CheckoutArgs {
  items: CheckoutItem[];
  couponCode?: string;
}

export const checkout = async (args: CheckoutArgs, _context: any) => {
  const { items, couponCode } = args;

  if (!items || items.length === 0) {
    throw new HttpError(400, "Cart is empty");
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new HttpError(400, "Quantity must be greater than 0");
    }
  }

  // Execute the entire checkout process in a database transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduplicate and sort product IDs to prevent deadlocks under concurrent requests
    const productIds = Array.from(new Set(items.map((item) => item.productId))).sort((a, b) => a - b);

    // Lock the product rows in PostgreSQL to prevent concurrent updates
    const products = await tx.$queryRawUnsafe<any[]>(
      `SELECT * FROM "Product" WHERE id IN (${productIds.join(",")}) FOR UPDATE`
    );

    const productMap = new Map<number, any>();
    for (const p of products) {
      productMap.set(p.id, p);
    }

    // Check inventory for each item
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new HttpError(404, `Product with ID ${item.productId} not found`);
      }
      if (product.inventory < item.quantity) {
        throw new HttpError(
          400,
          `Insufficient inventory for product "${product.name}". Only ${product.inventory} left, but you requested ${item.quantity}.`
        );
      }
    }

    // Decrement inventory for each product
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      const itemPrice = product.price;
      subtotal += itemPrice * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
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

    let total = subtotal - discount;
    if (total < 0) {
      discount = subtotal; // discount cannot exceed subtotal
      total = 0;
    }

    // Create the Order
    const order = await tx.order.create({
      data: {
        subtotal,
        discount,
        total,
        couponCode: couponCode ? couponCode.toUpperCase() : null,
        orderItems: {
          create: orderItemsData.map((oi) => ({
            productId: oi.productId,
            quantity: oi.quantity,
            price: oi.price,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    return order;
  });

  return result;
};
