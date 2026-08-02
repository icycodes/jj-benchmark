import React, { useState } from "react";
import { useQuery, getTickets, getAgents, createTicket, simulateSlaBreach } from "wasp/client/operations";
import { logout } from "wasp/client/auth";
import "./Main.css";

export function MainPage({ user }: { user: any }) {
  const { data: tickets, error: ticketsError, isLoading: ticketsLoading } = useQuery(getTickets);
  const { data: agents, error: agentsError, isLoading: agentsLoading } = useQuery(getAgents);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("LOW");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!title.trim() || !description.trim()) {
      setFormError("Title and description are required");
      return;
    }
    try {
      await createTicket({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("LOW");
    } catch (err: any) {
      setFormError(err.message || "Failed to create ticket");
    }
  };

  const handleSimulateBreach = async (ticketId: number) => {
    try {
      await simulateSlaBreach({ ticketId });
    } catch (err: any) {
      alert(err.message || "Failed to simulate SLA breach");
    }
  };

  return (
    <main className="container" style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Support Ticket System</h1>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            Logged in as: <strong>{user.username}</strong> ({user.role})
          </p>
        </div>
        <button onClick={logout} style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        {/* Left Column: Agents & Create Ticket */}
        <div>
          {/* Agents Section */}
          <section style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Agents Workload</h2>
            {agentsLoading ? (
              <p>Loading agents...</p>
            ) : agentsError ? (
              <p style={{ color: "red" }}>Error loading agents</p>
            ) : agents && agents.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {agents.map((agent: any) => (
                  <li key={agent.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span>{agent.username}</span>
                    <span data-testid={`agent-workload-${agent.username}`} style={{ fontWeight: "bold" }}>
                      {agent.workload}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No agents in the system.</p>
            )}
          </section>

          {/* Create Ticket Section */}
          <section style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px" }}>
            <h2 style={{ marginTop: 0 }}>Create Ticket</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formError && <p style={{ color: "red", margin: 0 }}>{formError}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label htmlFor="ticket-title">Title</label>
                <input
                  type="text"
                  id="ticket-title"
                  data-testid="ticket-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label htmlFor="ticket-desc">Description</label>
                <textarea
                  id="ticket-desc"
                  data-testid="ticket-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label htmlFor="ticket-priority">Priority</label>
                <select
                  id="ticket-priority"
                  data-testid="ticket-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <button
                type="submit"
                id="submit-ticket"
                data-testid="submit-ticket"
                style={{ marginTop: "10px", padding: "10px", backgroundColor: "#2196F3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
                Submit Ticket
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Ticket List */}
        <div>
          <section style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px" }}>
            <h2 style={{ marginTop: 0 }}>Tickets</h2>
            {ticketsLoading ? (
              <p>Loading tickets...</p>
            ) : ticketsError ? (
              <p style={{ color: "red" }}>Error loading tickets</p>
            ) : tickets && tickets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {tickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    data-testid="ticket-item"
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "15px",
                      backgroundColor: ticket.isEscalated ? "#fffde7" : "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <h3 style={{ margin: 0 }}>{ticket.title}</h3>
                      <span
                        data-testid={`ticket-status-badge-${ticket.id}`}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#fff",
                          backgroundColor: ticket.isEscalated ? "#f44336" : ticket.status === "RESOLVED" ? "#4CAF50" : "#ff9800",
                        }}
                      >
                        {ticket.isEscalated ? "ESCALATED" : ticket.status}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 10px 0", color: "#555" }}>{ticket.description}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "14px", color: "#666", marginBottom: "15px" }}>
                      <div>
                        <strong>Priority:</strong> {ticket.priority}
                      </div>
                      <div>
                        <strong>Status:</strong> {ticket.status}
                      </div>
                      <div>
                        <strong>Assignee:</strong>{" "}
                        <span data-testid={`ticket-assignee-${ticket.id}`}>
                          {ticket.assignee ? ticket.assignee.username : "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <strong>Escalated:</strong>{" "}
                        <span data-testid={`ticket-escalated-${ticket.id}`}>
                          {ticket.isEscalated ? "Yes" : "No"}
                        </span>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <strong>SLA Deadline:</strong>{" "}
                        <span data-testid={`ticket-sla-deadline-${ticket.id}`}>
                          {new Date(ticket.slaDeadline).toISOString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        data-testid={`simulate-breach-${ticket.id}`}
                        onClick={() => handleSimulateBreach(ticket.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#ff5722",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Simulate SLA Breach
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No tickets available.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
