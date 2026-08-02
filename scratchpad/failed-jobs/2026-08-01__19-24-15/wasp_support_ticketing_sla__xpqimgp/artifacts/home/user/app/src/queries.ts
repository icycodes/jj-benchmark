import { type GetTickets, type GetAgents } from "wasp/server/operations";
import { HttpError } from "wasp/server";

export const getTickets: GetTickets = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return context.entities.Ticket.findMany({
    include: {
      assignee: true,
      creator: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getAgents: GetAgents = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const agents = await context.entities.User.findMany({
    where: {
      role: "AGENT",
    },
    include: {
      ticketsAssigned: {
        where: {
          status: {
            not: "RESOLVED",
          },
        },
      },
    },
  });

  return agents.map((agent) => ({
    id: agent.id,
    username: agent.username,
    workload: agent.ticketsAssigned.length,
  }));
};
