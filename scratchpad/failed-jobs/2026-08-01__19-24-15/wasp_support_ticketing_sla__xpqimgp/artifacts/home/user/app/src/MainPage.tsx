import React, { useState } from "react";
import type { AuthUser } from "wasp/auth";
import { logout } from "wasp/client/auth";
import { useQuery, getTickets, getAgents } from "wasp/client/operations";
import { createTicket, simulateSlaBreach } from "wasp/client/operations";
import "./Main.css";

export function MainPage({ user }: { user: AuthUser }) {
  const { data: tickets, error: ticketsError } = useQuery(getTickets);
  const { data: agents, error: agentsError } = useQuery(getAgents);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("LOW");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await createTicket({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("LOW");
    } catch (err: any) {
      alert("Error creating ticket: " + err.message);
    }
  };

  const handleSimulateBreach = async (ticketId: number) => {
    try {
      await simulateSlaBreach({ ticketId });
    } catch (err: any) {
      alert("Error simulating breach: " + err.message);
    }
  };

  const ticketList = (tickets as any) || [];
  const agentList = (agents as any) || [];

  return (
    <main className="container" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
        <div>
          <h1 className="title" style={{ fontSize: "1.5rem", margin: 0 }}>Support Ticket System</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            Logged in as: <strong>{user.username}</strong> ({user.role})
          </p>
        </div>
        <button 
          onClick={logout}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </header>

      {/* Agents workload section */}
      <section style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Agents Workload</h2>
        {agentsError && <p style={{ color: "red" }}>Error loading agents: {agentsError.message}</p>}
        {agentList.length === 0 ? (
          <p>No agents in the system.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {agentList.map((agent: any) => (
              <div 
                key={agent.id} 
                style={{
                  padding: "0.75rem",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <strong>{agent.username}</strong>
                <span 
                  data-testid={`agent-workload-${agent.username}`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "12px",
                    fontSize: "0.875rem",
                    fontWeight: "bold"
                  }}
                >
                  {agent.workload}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ticket Creation Form */}
      <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Create New Ticket</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="ticket-title" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Title</label>
            <input 
              type="text" 
              id="ticket-title" 
              data-testid="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
              required
            />
          </div>
          <div>
            <label htmlFor="ticket-desc" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Description</label>
            <textarea 
              id="ticket-desc" 
              data-testid="ticket-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", minHeight: "100px" }}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="ticket-priority" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Priority</label>
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
            style={{
              padding: "0.75rem",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Submit Ticket
          </button>
        </form>
      </section>

      {/* Ticket List */}
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Tickets</h2>
        {ticketsError && <p style={{ color: "red" }}>Error loading tickets: {ticketsError.message}</p>}
        {ticketList.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {ticketList.map((ticket: any) => (
              <div 
                key={ticket.id} 
                data-testid="ticket-item"
                style={{
                  padding: "1rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  backgroundColor: "white"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{ticket.title}</h3>
                  <span 
                    data-testid={`ticket-status-badge-${ticket.id}`}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      backgroundColor: ticket.isEscalated ? "#ffebee" : (ticket.status === "RESOLVED" ? "#e8f5e9" : "#fff3e0"),
                      color: ticket.isEscalated ? "#c62828" : (ticket.status === "RESOLVED" ? "#2e7d32" : "#ef6c00")
                    }}
                  >
                    {ticket.isEscalated ? "ESCALATED" : ticket.status}
                  </span>
                </div>
                <p style={{ margin: "0 0 1rem 0", color: "#555" }}>{ticket.description}</p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
                  <div>
                    <strong>Priority:</strong> {ticket.priority}
                  </div>
                  <div>
                    <strong>Assignee:</strong>{" "}
                    <span data-testid={`ticket-assignee-${ticket.id}`}>
                      {ticket.assignee ? ticket.assignee.username : "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <strong>SLA Deadline:</strong>{" "}
                    <span data-testid={`ticket-sla-deadline-${ticket.id}`}>
                      {new Date(ticket.slaDeadline).toISOString()}
                    </span>
                  </div>
                  <div>
                    <strong>Escalated:</strong>{" "}
                    <span data-testid={`ticket-escalated-${ticket.id}`}>
                      {ticket.isEscalated ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <button 
                  data-testid={`simulate-breach-${ticket.id}`}
                  onClick={() => handleSimulateBreach(ticket.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#ff9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem"
                  }}
                >
                  Simulate SLA Breach
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
