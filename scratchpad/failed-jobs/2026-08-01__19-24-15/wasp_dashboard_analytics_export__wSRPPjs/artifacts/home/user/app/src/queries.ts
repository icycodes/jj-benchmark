import { HttpError } from "wasp/server";
import { prisma } from "wasp/server";
import { type GetAnalytics } from "wasp/server/operations";

type GetAnalyticsInput = {
  startDate: string;
  endDate: string;
  resolution: "day" | "week" | "month";
};

export const getAnalytics: GetAnalytics<GetAnalyticsInput, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const userId = context.user.id;
  const startDate = args.startDate;
  const endDate = args.endDate;

  // Perform raw query for time-series aggregation in SQLite on the main prisma client
  const timeSeriesRaw = await prisma.$queryRaw`
    SELECT
      CASE
        WHEN ${args.resolution} = 'day' THEN strftime('%Y-%m-%d', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END)
        WHEN ${args.resolution} = 'month' THEN strftime('%Y-%m', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END)
        ELSE strftime('%Y-W%W', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END)
      END as period,
      COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as expense
    FROM "Transaction"
    WHERE userId = ${userId}
      AND strftime('%Y-%m-%d', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END) >= ${startDate}
      AND strftime('%Y-%m-%d', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END) <= ${endDate}
    GROUP BY period
    ORDER BY period ASC
  `;

  // Perform raw query for category breakdown
  const categoryBreakdownRaw = await prisma.$queryRaw`
    SELECT
      category,
      COALESCE(SUM(amount), 0) as amount,
      type
    FROM "Transaction"
    WHERE userId = ${userId}
      AND strftime('%Y-%m-%d', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END) >= ${startDate}
      AND strftime('%Y-%m-%d', CASE WHEN date LIKE '%-%' THEN date ELSE datetime(date / 1000, 'unixepoch') END) <= ${endDate}
    GROUP BY category, type
  `;

  const timeSeries = (timeSeriesRaw as any[]).map((row) => {
    const income = Number(row.income || 0);
    const expense = Number(row.expense || 0);
    return {
      date: row.period,
      income,
      expense,
      net: income - expense,
    };
  });

  const categoryBreakdown = (categoryBreakdownRaw as any[]).map((row) => ({
    category: row.category,
    amount: Number(row.amount || 0),
    type: row.type as "INCOME" | "EXPENSE",
  }));

  const totalIncome = timeSeries.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = timeSeries.reduce((acc, curr) => acc + curr.expense, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    timeSeries,
    categoryBreakdown,
    summary: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
    }
  };
};
