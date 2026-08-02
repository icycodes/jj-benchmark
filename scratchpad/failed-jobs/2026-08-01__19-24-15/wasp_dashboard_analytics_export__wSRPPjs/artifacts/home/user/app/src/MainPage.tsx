import { useState } from "react";
import { useQuery, getAnalytics, createTransaction } from "wasp/client/operations";
import { logout } from "wasp/client/auth";

export function MainPage() {
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [resolution, setResolution] = useState<"day" | "week" | "month">("day");

  // Form states for creating a new transaction
  const [newTxDate, setNewTxDate] = useState("2026-07-01");
  const [newTxAmount, setNewTxAmount] = useState("");
  const [newTxType, setNewTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [newTxCategory, setNewTxCategory] = useState("");
  const [newTxDescription, setNewTxDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const { data: analytics, isLoading, error, refetch } = useQuery(getAnalytics, {
    startDate,
    endDate,
    resolution,
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newTxDate || !newTxAmount || !newTxCategory || !newTxDescription) {
      setFormError("All fields are required.");
      return;
    }

    const amountNum = parseFloat(newTxAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }

    try {
      await createTransaction({
        date: newTxDate,
        amount: amountNum,
        type: newTxType,
        category: newTxCategory,
        description: newTxDescription,
      });
      setFormSuccess("Transaction created successfully!");
      // Reset form fields
      setNewTxAmount("");
      setNewTxCategory("");
      setNewTxDescription("");
      // Refetch analytics data
      refetch();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create transaction.");
    }
  };

  const handleExportCSV = () => {
    if (!analytics || !analytics.timeSeries) return;

    // Only include rows for dates that have non-zero activity (income or expense)
    const filteredRows = analytics.timeSeries.filter(
      (row: any) => row.income !== 0 || row.expense !== 0
    );

    // Sort chronologically
    const sortedRows = [...filteredRows].sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    // Build CSV content
    const headers = "Date,Income,Expense,Net";
    const rows = sortedRows.map(
      (row: any) => `${row.date},${row.income},${row.expense},${row.net}`
    );
    const csvContent = [headers, ...rows].join("\n");

    // Create Blob and trigger download
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

  // Format numbers to match standard currency displays (e.g., 7,500.00)
  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#1a202c" }}>Financial Analytics Dashboard</h1>
          <p style={{ margin: "5px 0 0 0", color: "#718096" }}>Track income, expenses, and savings rate</p>
        </div>
        <div>
          <button
            onClick={logout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#e53e3e",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
        
        {/* Controls Section */}
        <section style={{ backgroundColor: "#f7fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginTop: 0, marginBottom: "15px", fontSize: "18px", color: "#2d3748" }}>Filters</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: "200px" }}>
              <label htmlFor="start-date" style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "14px", color: "#4a5568" }}>Start Date</label>
              <input
                type="date"
                id="start-date"
                data-testid="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", minWidth: "200px" }}>
              <label htmlFor="end-date" style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "14px", color: "#4a5568" }}>End Date</label>
              <input
                type="date"
                id="end-date"
                data-testid="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
              <label htmlFor="resolution" style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "14px", color: "#4a5568" }}>Resolution</label>
              <select
                id="resolution"
                data-testid="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e0", backgroundColor: "white" }}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                id="export-csv"
                data-testid="export-csv"
                onClick={handleExportCSV}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3182ce",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  height: "42px",
                }}
              >
                Export CSV
              </button>
            </div>
          </div>
        </section>

        {/* Loading and Error States */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "40px", fontSize: "18px", color: "#4a5568" }}>
            Loading analytics data...
          </div>
        )}

        {error && (
          <div style={{ padding: "20px", backgroundColor: "#fff5f5", border: "1px solid #feb2b2", borderRadius: "8px", color: "#c53030" }}>
            Error fetching analytics: {error.message || "Unknown error"}
          </div>
        )}

        {/* Dashboard Metrics and Data */}
        {analytics && !isLoading && (
          <>
            {/* Summary Cards */}
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              <div style={{ backgroundColor: "#ebf8ff", border: "1px solid #bee3f8", padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#2b6cb0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Income</h3>
                <p data-testid="total-income" style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#2b6cb0" }}>
                  ${formatCurrency(analytics.summary.totalIncome)}
                </p>
              </div>

              <div style={{ backgroundColor: "#fff5f5", border: "1px solid #fed7d7", padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#9b2c2c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Expense</h3>
                <p data-testid="total-expense" style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#9b2c2c" }}>
                  ${formatCurrency(analytics.summary.totalExpense)}
                </p>
              </div>

              <div style={{ backgroundColor: "#f0fff4", border: "1px solid #c6f6d5", padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#22543d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Savings</h3>
                <p data-testid="net-savings" style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#22543d" }}>
                  ${formatCurrency(analytics.summary.netSavings)}
                </p>
              </div>

              <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d8fd", padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#553c9a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Savings Rate</h3>
                <p data-testid="savings-rate" style={{ margin: "10px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#553c9a" }}>
                  {analytics.summary.savingsRate.toFixed(2)}%
                </p>
              </div>
            </section>

            {/* Grid for Table and Charts/Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr lg(2fr)", gap: "30px" }}>
              
              {/* Time-Series Table */}
              <section style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
                <h2 style={{ marginTop: 0, marginBottom: "15px", fontSize: "18px", color: "#2d3748" }}>Time-Series Report</h2>
                <div style={{ overflowX: "auto" }}>
                  <table data-testid="analytics-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #edf2f7" }}>
                        <th style={{ padding: "12px 10px", color: "#4a5568", fontWeight: "bold" }}>Period/Date</th>
                        <th style={{ padding: "12px 10px", color: "#4a5568", fontWeight: "bold" }}>Income</th>
                        <th style={{ padding: "12px 10px", color: "#4a5568", fontWeight: "bold" }}>Expense</th>
                        <th style={{ padding: "12px 10px", color: "#4a5568", fontWeight: "bold" }}>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.timeSeries.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: "20px 10px", textAlign: "center", color: "#718096" }}>
                            No transactions found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        analytics.timeSeries.map((row: any, idx: number) => (
                          <tr key={idx} data-testid="analytics-row" style={{ borderBottom: "1px solid #edf2f7" }}>
                            <td style={{ padding: "12px 10px", fontWeight: "medium", color: "#2d3748" }}>{row.date}</td>
                            <td style={{ padding: "12px 10px", color: "#2b6cb0", fontWeight: "bold" }}>${formatCurrency(row.income)}</td>
                            <td style={{ padding: "12px 10px", color: "#9b2c2c", fontWeight: "bold" }}>${formatCurrency(row.expense)}</td>
                            <td style={{ padding: "12px 10px", color: row.net >= 0 ? "#22543d" : "#9b2c2c", fontWeight: "bold" }}>
                              ${formatCurrency(row.net)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Category Breakdown & Transaction Creator */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
                
                {/* Category Breakdown */}
                <section style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
                  <h2 style={{ marginTop: 0, marginBottom: "15px", fontSize: "18px", color: "#2d3748" }}>Category Breakdown</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {analytics.categoryBreakdown.length === 0 ? (
                      <p style={{ color: "#718096", margin: 0 }}>No category data available.</p>
                    ) : (
                      analytics.categoryBreakdown.map((cat: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "#f7fafc", borderRadius: "5px" }}>
                          <div>
                            <span style={{ fontWeight: "bold", color: "#2d3748" }}>{cat.category}</span>
                            <span style={{
                              marginLeft: "10px",
                              fontSize: "12px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: "bold",
                              backgroundColor: cat.type === "INCOME" ? "#c6f6d5" : "#fed7d7",
                              color: cat.type === "INCOME" ? "#22543d" : "#9b2c2c"
                            }}>
                              {cat.type}
                            </span>
                          </div>
                          <span style={{ fontWeight: "bold", color: "#4a5568" }}>${formatCurrency(cat.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Create Transaction Form */}
                <section style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
                  <h2 style={{ marginTop: 0, marginBottom: "15px", fontSize: "18px", color: "#2d3748" }}>Add Transaction</h2>
                  
                  {formError && (
                    <div style={{ padding: "10px", backgroundColor: "#fff5f5", border: "1px solid #feb2b2", borderRadius: "5px", color: "#c53030", marginBottom: "15px", fontSize: "14px" }}>
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div style={{ padding: "10px", backgroundColor: "#f0fff4", border: "1px solid #c6f6d5", borderRadius: "5px", color: "#22543d", marginBottom: "15px", fontSize: "14px" }}>
                      {formSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateTransaction} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", marginBottom: "5px" }}>Date</label>
                      <input
                        type="date"
                        value={newTxDate}
                        onChange={(e) => setNewTxDate(e.target.value)}
                        style={{ padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", marginBottom: "5px" }}>Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 50.00"
                        value={newTxAmount}
                        onChange={(e) => setNewTxAmount(e.target.value)}
                        style={{ padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", marginBottom: "5px" }}>Type</label>
                      <select
                        value={newTxType}
                        onChange={(e) => setNewTxType(e.target.value as any)}
                        style={{ padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0", backgroundColor: "white" }}
                      >
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", marginBottom: "5px" }}>Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales, Groceries"
                        value={newTxCategory}
                        onChange={(e) => setNewTxCategory(e.target.value)}
                        style={{ padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gridColumn: "1 / span 2" }}>
                      <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", marginBottom: "5px" }}>Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly salary, SaaS bill"
                        value={newTxDescription}
                        onChange={(e) => setNewTxDescription(e.target.value)}
                        style={{ padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        gridColumn: "1 / span 2",
                        padding: "10px",
                        backgroundColor: "#48bb78",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        marginTop: "10px",
                      }}
                    >
                      Add Transaction
                    </button>
                  </form>
                </section>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
