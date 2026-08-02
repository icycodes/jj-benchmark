import { HttpError } from "wasp/server";

export const createTransaction = async (
  args: { date: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; description: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { date, amount, type, category, description } = args;

  if (type !== "INCOME" && type !== "EXPENSE") {
    throw new HttpError(400, "Invalid type. Must be INCOME or EXPENSE.");
  }

  // Parse the date in UTC to avoid timezone shifting
  const parsedDate = new Date(date + "T00:00:00.000Z");

  const newTransaction = await context.entities.Transaction.create({
    data: {
      date: parsedDate,
      amount,
      type,
      category,
      description,
      user: {
        connect: { id: context.user.id },
      },
    },
  });

  return newTransaction;
};
