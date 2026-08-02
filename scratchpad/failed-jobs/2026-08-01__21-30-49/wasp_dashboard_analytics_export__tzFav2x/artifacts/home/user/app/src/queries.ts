import { HttpError } from "wasp/server";

export const getAnalytics = async (
  args: { startDate: string; endDate: string; resolution: "day" | "week" | "month" },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { startDate, endDate, resolution } = args;

  let formatStr = "%Y-%m-%d";
  if (resolution === "month") {
    formatStr = "%Y-%m";
  } else if (resolution === "week") {
    formatStr = "%Y-W%W";
  }

  // 1. Fetch aggregated time series from SQLite
  const rawTimeSeries: any[] = await context.entities.Transaction.$queryRaw`
    SELECT 
      strftime(${formatStr}, date) as dateGroup,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
    FROM Transaction
    WHERE userId = ${context.user.id}
    AND strftime('%Y-%m-%d', date) >= ${startDate}
    AND strftime('%Y-%m-%d', date) <= ${endDate}
    GROUP BY dateGroup
    ORDER BY dateGroup ASC
  `;

  const timeSeries = rawTimeSeries.map((row) => {
    const income = Number(row.income || 0);
    const expense = Number(row.expense || 0);
    return {
      date: String(row.dateGroup),
      income,
      expense,
      net: income - expense,
    };
  });

  // 2. Fetch category breakdown
  const rawCategoryBreakdown: any[] = await context.entities.Transaction.$queryRaw`
    SELECT 
      category,
      type,
      SUM(amount) as amount
    FROM Transaction
    WHERE userId = ${context.user.id}
    AND strftime('%Y-%m-%d', date) >= ${startDate}
    AND strftime('%Y-%m-%d', date) <= ${endDate}
    GROUP BY category, type
    ORDER BY amount DESC
  `;

  const categoryBreakdown = rawCategoryBreakdown.map((row) => ({
    category: String(row.category),
    amount: Number(row.amount || 0),
    type: row.type as "INCOME" | "EXPENSE",
  }));

  // 3. Calculate summary
  let totalIncome = 0;
  let totalExpense = 0;
  for (const item of timeSeries) {
    totalIncome += item.income;
    totalExpense += item.expense;
  }
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
    },
  };
};
