import { useState } from "react";
import { useAuth, logout } from "wasp/client/auth";
import { useQuery, getAnalytics, createTransaction } from "wasp/client/operations";

export function MainPage() {
  const { data: user } = useAuth();

  // State for filters
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [resolution, setResolution] = useState<"day" | "week" | "month">("day");

  // State for creating a transaction
  const [txDate, setTxDate] = useState("2026-07-01");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txMessage, setTxDescriptionMessage] = useState("");

  // Fetch analytics data using useQuery
  const { data: analytics, isLoading, error, refetch } = useQuery(getAnalytics, {
    startDate,
    endDate,
    resolution,
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || isNaN(Number(txAmount))) {
      setTxDescriptionMessage("Please enter a valid amount.");
      return;
    }
    try {
      await createTransaction({
        date: txDate,
        amount: Number(txAmount),
        type: txType,
        category: txCategory || "General",
        description: txDescription || "No description",
      });
      setTxAmount("");
      setTxCategory("");
      setTxDescription("");
      setTxDescriptionMessage("Transaction created successfully!");
      refetch();
    } catch (err: any) {
      setTxDescriptionMessage("Error creating transaction: " + (err.message || err));
    }
  };

  const handleExportCSV = () => {
    if (!analytics || !analytics.timeSeries) return;

    // Filter rows that have non-zero activity (income or expense) within the selected date range
    const filteredRows = analytics.timeSeries.filter(
      (row: any) => row.income !== 0 || row.expense !== 0
    );

    // Sort chronologically
    const sortedRows = [...filteredRows].sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    // Form the CSV content
    const headers = "Date,Income,Expense,Net";
    const rows = sortedRows.map(
      (row: any) => `${row.date},${row.income},${row.expense},${row.net}`
    );
    const csvContent = [headers, ...rows].join("\n");

    // Create a blob and trigger download
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

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Loading authentication...</h2>
      </div>
    );
  }

  // Fallback values for summary
  const summary = analytics?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    savingsRate: 0,
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#2c3e50" }}>Financial Analytics Dashboard</h1>
          <p style={{ margin: "5px 0 0 0", color: "#7f8c8d" }}>Logged in as {user.identities?.username?.id || "User"}</p>
        </div>
        <button
          onClick={logout}
          style={{ padding: "8px 16px", backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        
        {/* Controls Panel */}
        <section style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#34495e" }}>Filters</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="start-date" style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Start Date</label>
              <input
                type="date"
                id="start-date"
                data-testid="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="end-date" style={{ fontWeight: "bold", fontSize: "0.9rem" }}>End Date</label>
              <input
                type="date"
                id="end-date"
                data-testid="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="resolution" style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Resolution</label>
              <select
                id="resolution"
                data-testid="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as "day" | "week" | "month")}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "120px" }}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            <button
              id="export-csv"
              data-testid="export-csv"
              onClick={handleExportCSV}
              style={{ padding: "9px 20px", backgroundColor: "#27ae60", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              Export CSV
            </button>
          </div>
        </section>

        {/* Summary Cards */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          <div style={{ backgroundColor: "#ebf5fb", padding: "20px", borderRadius: "8px", border: "1px solid #d4e6f1" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#2980b9", textTransform: "uppercase" }}>Total Income</h3>
            <p data-testid="total-income" style={{ margin: "10px 0 0 0", fontSize: "1.8rem", fontWeight: "bold", color: "#2c3e50" }}>
              ${summary.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ backgroundColor: "#fdf2e9", padding: "20px", borderRadius: "8px", border: "1px solid #fadbd8" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#e74c3c", textTransform: "uppercase" }}>Total Expense</h3>
            <p data-testid="total-expense" style={{ margin: "10px 0 0 0", fontSize: "1.8rem", fontWeight: "bold", color: "#2c3e50" }}>
              ${summary.totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ backgroundColor: "#eafaf1", padding: "20px", borderRadius: "8px", border: "1px solid #d5f5e3" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#27ae60", textTransform: "uppercase" }}>Net Savings</h3>
            <p data-testid="net-savings" style={{ margin: "10px 0 0 0", fontSize: "1.8rem", fontWeight: "bold", color: "#2c3e50" }}>
              ${summary.netSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ backgroundColor: "#f5eef8", padding: "20px", borderRadius: "8px", border: "1px solid #ebdef0" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#8e44ad", textTransform: "uppercase" }}>Savings Rate</h3>
            <p data-testid="savings-rate" style={{ margin: "10px 0 0 0", fontSize: "1.8rem", fontWeight: "bold", color: "#2c3e50" }}>
              {summary.savingsRate.toFixed(2)}%
            </p>
          </div>
        </section>

        {/* Dashboard Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          
          {/* Analytics Table */}
          <section style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#2c3e50", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Time Series</h2>
            {isLoading ? (
              <p>Loading analytics data...</p>
            ) : error ? (
              <p style={{ color: "#e74c3c" }}>Error: {String(error)}</p>
            ) : !analytics || analytics.timeSeries.length === 0 ? (
              <p>No transactions found for the selected range.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table data-testid="analytics-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee" }}>
                      <th style={{ padding: "10px 5px" }}>Date</th>
                      <th style={{ padding: "10px 5px" }}>Income</th>
                      <th style={{ padding: "10px 5px" }}>Expense</th>
                      <th style={{ padding: "10px 5px" }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.timeSeries.map((row: any, idx: number) => (
                      <tr key={idx} data-testid="analytics-row" style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px 5px" }}>{row.date}</td>
                        <td style={{ padding: "10px 5px", color: row.income > 0 ? "#27ae60" : "#7f8c8d" }}>
                          ${row.income.toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 5px", color: row.expense > 0 ? "#e74c3c" : "#7f8c8d" }}>
                          ${row.expense.toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 5px", fontWeight: "bold", color: row.net >= 0 ? "#27ae60" : "#e74c3c" }}>
                          ${row.net.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Category Breakdown & Create Transaction Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Category Breakdown */}
            <section style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#2c3e50", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Category Breakdown</h2>
              {isLoading ? (
                <p>Loading category data...</p>
              ) : !analytics || analytics.categoryBreakdown.length === 0 ? (
                <p>No category breakdown available.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analytics.categoryBreakdown.map((item: any, idx: number) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                      <div>
                        <span style={{ fontWeight: "bold", color: "#34495e" }}>{item.category}</span>
                        <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: item.type === "INCOME" ? "#27ae60" : "#e74c3c", backgroundColor: item.type === "INCOME" ? "#eafaf1" : "#fdf2e9", padding: "2px 6px", borderRadius: "3px" }}>
                          {item.type}
                        </span>
                      </div>
                      <span style={{ fontWeight: "bold" }}>${item.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Create Transaction Form */}
            <section style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#2c3e50", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Add Transaction</h2>
              <form onSubmit={handleCreateTransaction} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Date</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      required
                      style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required
                      style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Type</label>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as "INCOME" | "EXPENSE")}
                      style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Sales, Marketing"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      required
                      style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Description</label>
                  <input
                    type="text"
                    placeholder="Brief description"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    required
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ padding: "10px", backgroundColor: "#3498db", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "5px" }}
                >
                  Add Transaction
                </button>

                {txMessage && (
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: txMessage.includes("Error") ? "#e74c3c" : "#27ae60", textAlign: "center" }}>
                    {txMessage}
                  </p>
                )}
              </form>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
