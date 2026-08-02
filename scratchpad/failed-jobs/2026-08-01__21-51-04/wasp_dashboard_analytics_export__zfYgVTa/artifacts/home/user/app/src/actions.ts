import { HttpError } from "wasp/server";

export const createTransaction = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { date, amount, type, category, description } = args;

  if (!date || !amount || !type || !category || !description) {
    throw new HttpError(400, "Missing required fields");
  }

  if (type !== "INCOME" && type !== "EXPENSE") {
    throw new HttpError(400, "Type must be INCOME or EXPENSE");
  }

  return await context.entities.Transaction.create({
    data: {
      date: new Date(date),
      amount: parseFloat(amount),
      type,
      category,
      description,
      user: { connect: { id: context.user.id } },
    },
  });
};
