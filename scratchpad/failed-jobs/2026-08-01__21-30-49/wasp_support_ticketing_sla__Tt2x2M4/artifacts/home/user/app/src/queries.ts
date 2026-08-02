import { type GetTickets, type GetAgents } from "wasp/server/operations";

export const getTickets: GetTickets<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }
  return context.entities.Ticket.findMany({
    include: {
      assignee: true,
      creator: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getAgents: GetAgents<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }
  const agents = await context.entities.User.findMany({
    where: { role: 'AGENT' },
    include: {
      ticketsAssigned: {
        where: { NOT: { status: 'RESOLVED' } }
      }
    }
  });
  return agents.map(agent => ({
    id: agent.id,
    username: agent.username,
    role: agent.role,
    workload: agent.ticketsAssigned.length
  }));
};
