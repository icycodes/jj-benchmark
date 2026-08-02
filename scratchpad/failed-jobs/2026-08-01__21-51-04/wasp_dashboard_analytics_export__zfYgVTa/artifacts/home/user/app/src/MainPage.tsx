import { useState } from "react";
import { useQuery, getAnalytics, createTransaction } from "wasp/client/operations";
import { logout } from "wasp/client/auth";
import "./Main.css";

export function MainPage({ user }: { user: any }) {
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [resolution, setResolution] = useState<"day" | "week" | "month">("day");

  // Transaction form state
  const [txDate, setTxDate] = useState("2026-07-01");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Fetch analytics data
  const { data, isLoading, error, refetch } = useQuery(getAnalytics, {
    startDate,
    endDate,
    resolution,
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!txDate || !txAmount || !txCategory || !txDescription) {
      setFormError("All fields are required.");
      return;
    }

    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }

    try {
      await createTransaction({
        date: txDate,
        amount: amountNum,
        type: txType,
        category: txCategory,
        description: txDescription,
      });

      setFormSuccess("Transaction added successfully!");
      setTxAmount("");
      setTxCategory("");
      setTxDescription("");
      refetch();
    } catch (err: any) {
      setFormError(err.message || "Failed to add transaction.");
    }
  };

  const handleExportCSV = () => {
    if (!data || !data.timeSeries) return;

    // Filter rows that have non-zero activity (income or expense)
    const activeRows = data.timeSeries.filter(
      (row: any) => row.income !== 0 || row.expense !== 0
    );

    // Headers
    const headers = ["Date", "Income", "Expense", "Net"];
    const csvRows = [headers.join(",")];

    for (const row of activeRows) {
      csvRows.push(`${row.date},${row.income},${row.expense},${row.net}`);
    }

    // Join with exactly \n and add a trailing newline
    const csvContent = csvRows.join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "analytics_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <h1>Financial Analytics Dashboard</h1>
        <div className="user-info">
          <span>Welcome, <strong>{user?.identities?.username?.id || "User"}</strong></span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Controls Section */}
      <section className="controls-card">
        <h2>Filters</h2>
        <div className="controls-grid">
          <div className="control-group">
            <label htmlFor="start-date">Start Date</label>
            <input
              type="date"
              id="start-date"
              data-testid="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="control-group">
            <label htmlFor="end-date">End Date</label>
            <input
              type="date"
              id="end-date"
              data-testid="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="control-group">
            <label htmlFor="resolution">Resolution</label>
            <select
              id="resolution"
              data-testid="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value as any)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="control-group export-group">
            <button
              id="export-csv"
              data-testid="export-csv"
              onClick={handleExportCSV}
              className="export-btn"
              disabled={!data || !data.timeSeries || data.timeSeries.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Summary Metrics Section */}
      <section className="metrics-grid">
        <div className="metric-card">
          <h3>Total Income</h3>
          <p className="metric-val" data-testid="total-income">
            ${data?.summary?.totalIncome?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
        </div>
        <div className="metric-card">
          <h3>Total Expense</h3>
          <p className="metric-val" data-testid="total-expense">
            ${data?.summary?.totalExpense?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
        </div>
        <div className="metric-card">
          <h3>Net Savings</h3>
          <p className="metric-val" data-testid="net-savings">
            ${data?.summary?.netSavings?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
        </div>
        <div className="metric-card">
          <h3>Savings Rate</h3>
          <p className="metric-val" data-testid="savings-rate">
            {data?.summary?.savingsRate?.toFixed(2) || "0.00"}%
          </p>
        </div>
      </section>

      <div className="dashboard-main-grid">
        {/* Time-Series Aggregation Table */}
        <section className="table-card">
          <h2>Time-Series Table</h2>
          {isLoading ? (
            <p className="loading">Loading analytics...</p>
          ) : error ? (
            <p className="error-msg">Error loading analytics: {error.message}</p>
          ) : !data || data.timeSeries.length === 0 ? (
            <p className="no-data">No transaction activity found for this period.</p>
          ) : (
            <div className="table-wrapper">
              <table data-testid="analytics-table" className="analytics-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Income</th>
                    <th>Expense</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeSeries.map((row: any, idx: number) => (
                    <tr key={idx} data-testid="analytics-row">
                      <td>{row.date}</td>
                      <td className="income-col">${row.income.toFixed(2)}</td>
                      <td className="expense-col">${row.expense.toFixed(2)}</td>
                      <td className={row.net >= 0 ? "net-positive" : "net-negative"}>
                        ${row.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sidebar: Category Breakdown & Add Transaction */}
        <aside className="sidebar-grid">
          {/* Category Breakdown */}
          <section className="category-card">
            <h2>Category Breakdown</h2>
            {!data || !data.categoryBreakdown || data.categoryBreakdown.length === 0 ? (
              <p className="no-data">No categories to display.</p>
            ) : (
              <ul className="category-list">
                {data.categoryBreakdown.map((item: any, idx: number) => (
                  <li key={idx} className="category-item">
                    <span className="cat-name">{item.category}</span>
                    <span className={`cat-amount ${item.type === "INCOME" ? "income-text" : "expense-text"}`}>
                      {item.type === "INCOME" ? "+" : "-"}${item.amount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Add Transaction Form */}
          <section className="add-tx-card">
            <h2>Add Transaction</h2>
            <form onSubmit={handleAddTransaction} className="add-tx-form">
              {formError && <p className="form-error">{formError}</p>}
              {formSuccess && <p className="form-success">{formSuccess}</p>}

              <div className="form-group">
                <label htmlFor="tx-date">Date</label>
                <input
                  type="date"
                  id="tx-date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tx-amount">Amount ($)</label>
                <input
                  type="number"
                  id="tx-amount"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tx-type">Type</label>
                <select
                  id="tx-type"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tx-category">Category</label>
                <input
                  type="text"
                  id="tx-category"
                  placeholder="e.g., Food, Salary, Rent"
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tx-description">Description</label>
                <input
                  type="text"
                  id="tx-description"
                  placeholder="e.g., Weekly groceries"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Add Transaction</button>
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}
