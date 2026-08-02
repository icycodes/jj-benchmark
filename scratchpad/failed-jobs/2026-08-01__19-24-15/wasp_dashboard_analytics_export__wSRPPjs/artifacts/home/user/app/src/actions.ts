import { HttpError } from "wasp/server";
import { type CreateTransaction } from "wasp/server/operations";

type CreateTransactionInput = {
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
};

export const createTransaction: CreateTransaction<CreateTransactionInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return context.entities.Transaction.create({
    data: {
      date: new Date(args.date),
      amount: args.amount,
      type: args.type,
      category: args.category,
      description: args.description,
      userId: context.user.id,
    },
  });
};
