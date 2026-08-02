import { prisma } from 'wasp/server';

export const applyCouponCode = async (args: { code: string }, context: any) => {
  const { code } = args;
  if (!code) {
    throw new Error("Coupon code is required");
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim() },
  });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  return coupon;
};

export const checkout = async (
  args: { cartItems: { productId: number; quantity: number }[]; couponCode?: string },
  context: any
) => {
  const { cartItems, couponCode } = args;
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  // We run everything in a transaction to ensure atomicity and consistency
  return await prisma.$transaction(async (tx: any) => {
    let subtotal = 0;
    const itemsToCreate: { productId: number; quantity: number; price: number }[] = [];

    // 1. Lock and validate products
    for (const item of cartItems) {
      // Lock the product row
      const products: any[] = await tx.$queryRawUnsafe(
        `SELECT * FROM "Product" WHERE id = $1 FOR UPDATE`,
        item.productId
      );

      if (products.length === 0) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      const product = products[0];

      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for product: ${product.name}`);
      }

      // Calculate subtotal
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });

      // Update product inventory
      await tx.product.update({
        where: { id: product.id },
        data: {
          inventory: product.inventory - item.quantity,
        },
      });
    }

    // 2. Validate and apply coupon if provided
    let discount = 0;
    if (couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: couponCode.trim() },
      });

      if (!coupon) {
        throw new Error("Invalid coupon code");
      }

      if (coupon.type === "PERCENT") {
        discount = subtotal * (coupon.value / 100);
      } else if (coupon.type === "FLAT") {
        discount = coupon.value;
      }
    }

    // Grand total cannot go below $0.00
    const total = Math.max(0, subtotal - discount);

    // 3. Create the Order
    const order = await tx.order.create({
      data: {
        subtotal,
        discount,
        total,
        couponCode: couponCode || null,
        orderItems: {
          create: itemsToCreate.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    return {
      orderId: order.id,
      subtotal,
      discount,
      total,
    };
  });
};
