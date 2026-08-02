import { HttpError } from "wasp/server";

export const getAnalytics = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { startDate, endDate, resolution } = args;

  if (!startDate || !endDate || !resolution) {
    throw new HttpError(400, "Missing required parameters");
  }

  try {
    const startMs = new Date(startDate + "T00:00:00.000Z").getTime();
    const endMs = new Date(endDate + "T23:59:59.999Z").getTime();

    let formatStr = "%Y-%m-%d";
    if (resolution === "week") {
      formatStr = "%Y-W%W";
    } else if (resolution === "month") {
      formatStr = "%Y-%m";
    }

    // 1. Time Series Aggregation
    const timeSeries = await context.entities.Transaction.$queryRawUnsafe(`
      SELECT 
        strftime('${formatStr}', date / 1000, 'unixepoch') as date,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as net
      FROM "Transaction"
      WHERE userId = ${context.user.id} 
        AND date >= ${startMs} 
        AND date <= ${endMs}
      GROUP BY date
      ORDER BY date ASC
    `);

    const formattedTimeSeries = timeSeries.map((row: any) => ({
      date: row.date,
      income: Number(row.income || 0),
      expense: Number(row.expense || 0),
      net: Number(row.net || 0),
    }));

    // 2. Category Breakdown
    const categoryBreakdown = await context.entities.Transaction.$queryRawUnsafe(`
      SELECT 
        category,
        SUM(amount) as amount,
        type
      FROM "Transaction"
      WHERE userId = ${context.user.id} 
        AND date >= ${startMs} 
        AND date <= ${endMs}
      GROUP BY category, type
      ORDER BY amount DESC
    `);

    const formattedCategoryBreakdown = categoryBreakdown.map((row: any) => ({
      category: row.category,
      amount: Number(row.amount || 0),
      type: row.type,
    }));

    // 3. Summary Aggregation
    const summaryRaw = await context.entities.Transaction.$queryRawUnsafe(`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as totalExpense
      FROM "Transaction"
      WHERE userId = ${context.user.id} 
        AND date >= ${startMs} 
        AND date <= ${endMs}
    `);

    const totalIncome = Number(summaryRaw[0]?.totalIncome || 0);
    const totalExpense = Number(summaryRaw[0]?.totalExpense || 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      timeSeries: formattedTimeSeries,
      categoryBreakdown: formattedCategoryBreakdown,
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
      },
    };
  } catch (error: any) {
    console.error("Error in getAnalytics query:", error);
    throw new HttpError(500, error.message || "Internal server error");
  }
};
