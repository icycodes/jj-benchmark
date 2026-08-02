import React, { useState } from "react";
import { logout } from "wasp/client/auth";
import { useQuery, getTickets, getAgents, createTicket, simulateSlaBreach } from "wasp/client/operations";
import "./Main.css";

export function MainPage({ user }: { user: any }) {
  const { data: tickets, isLoading: isTicketsLoading } = useQuery(getTickets);
  const { data: agents, isLoading: isAgentsLoading } = useQuery(getAgents);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW" >("LOW");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !description) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await createTicket({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("LOW");
    } catch (err: any) {
      setError(err.message || "Failed to create ticket.");
    }
  };

  const handleSimulateBreach = async (ticketId: number) => {
    try {
      await simulateSlaBreach({ ticketId });
    } catch (err: any) {
      alert(err.message || "Failed to simulate SLA breach.");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: "1rem", marginBottom: "2rem" }}>
        <div>
          <h2>Customer Support Ticket System</h2>
          <p>Logged in as: <strong>{user.username}</strong> ({user.role})</p>
        </div>
        <button onClick={logout} className="button button-outlined">Logout</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        {/* Left Column: Agents & Create Ticket */}
        <div>
          <section style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3>Agent Workloads</h3>
            {isAgentsLoading ? (
              <p>Loading agents...</p>
            ) : agents && agents.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {agents.map((agent: any) => (
                  <li key={agent.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
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

          <section style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3>Create a New Ticket</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div>
                <label htmlFor="ticket-title" style={{ display: "block", marginBottom: "0.5rem" }}>Title</label>
                <input
                  type="text"
                  id="ticket-title"
                  data-testid="ticket-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
              </div>

              <div>
                <label htmlFor="ticket-desc" style={{ display: "block", marginBottom: "0.5rem" }}>Description</label>
                <textarea
                  id="ticket-desc"
                  data-testid="ticket-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", minHeight: "100px" }}
                />
              </div>

              <div>
                <label htmlFor="ticket-priority" style={{ display: "block", marginBottom: "0.5rem" }}>Priority</label>
                <select
                  id="ticket-priority"
                  data-testid="ticket-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
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
                className="button button-filled"
                style={{ width: "100%" }}
              >
                Submit Ticket
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Ticket List */}
        <div>
          <section style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3>Tickets</h3>
            {isTicketsLoading ? (
              <p>Loading tickets...</p>
            ) : tickets && tickets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {tickets.map((ticket: any) => {
                  const statusBadgeValue = ticket.isEscalated ? "ESCALATED" : ticket.status;

                  return (
                    <div
                      key={ticket.id}
                      data-testid="ticket-item"
                      style={{ padding: "1rem", border: "1px solid #eee", borderRadius: "6px", backgroundColor: "#f9f9f9" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <h4 style={{ margin: 0 }}>{ticket.title}</h4>
                        <span
                          data-testid={`ticket-status-badge-${ticket.id}`}
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            backgroundColor: statusBadgeValue === "ESCALATED" ? "#ffebee" : statusBadgeValue === "RESOLVED" ? "#e8f5e9" : "#e3f2fd",
                            color: statusBadgeValue === "ESCALATED" ? "#c62828" : statusBadgeValue === "RESOLVED" ? "#2e7d32" : "#1565c0",
                          }}
                        >
                          {statusBadgeValue}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 1rem 0", color: "#555" }}>{ticket.description}</p>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem", marginBottom: "1rem" }}>
                        <div><strong>Priority:</strong> {ticket.priority}</div>
                        <div><strong>Status:</strong> {ticket.status}</div>
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

                      <button
                        data-testid={`simulate-breach-${ticket.id}`}
                        onClick={() => handleSimulateBreach(ticket.id)}
                        className="button button-outlined"
                        style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
                      >
                        Simulate SLA Breach
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No tickets found.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
