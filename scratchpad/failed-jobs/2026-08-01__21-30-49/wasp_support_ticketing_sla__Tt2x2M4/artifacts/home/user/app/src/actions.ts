import { type CreateTicket, type SimulateSlaBreach } from "wasp/server/operations";
import { HttpError } from "wasp/server";

export const createTicket: CreateTicket<{
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const now = new Date();
  let slaSeconds = 24 * 3600; // default LOW
  if (args.priority === 'HIGH') {
    slaSeconds = 3600;
  } else if (args.priority === 'MEDIUM') {
    slaSeconds = 14400;
  } else if (args.priority === 'LOW') {
    slaSeconds = 86400;
  }
  const slaDeadline = new Date(now.getTime() + slaSeconds * 1000);

  // Find all agents
  const agents = await context.entities.User.findMany({
    where: { role: 'AGENT' },
    include: {
      ticketsAssigned: {
        where: { NOT: { status: 'RESOLVED' } }
      }
    }
  });

  let assigneeId: number | null = null;
  if (agents.length > 0) {
    // Sort agents by workload, and then by id
    agents.sort((a, b) => {
      const workloadA = a.ticketsAssigned.length;
      const workloadB = b.ticketsAssigned.length;
      if (workloadA !== workloadB) {
        return workloadA - workloadB;
      }
      return a.id - b.id;
    });
    assigneeId = agents[0].id;
  }

  const ticket = await context.entities.Ticket.create({
    data: {
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: 'OPEN',
      createdAt: now,
      slaDeadline: slaDeadline,
      isEscalated: false,
      creatorId: context.user.id,
      assigneeId: assigneeId
    },
    include: {
      assignee: true,
      creator: true
    }
  });

  return ticket;
};

export const simulateSlaBreach: SimulateSlaBreach<{
  ticketId: number;
}, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const ticket = await context.entities.Ticket.findUnique({
    where: { id: args.ticketId }
  });
  if (!ticket) {
    throw new HttpError(404, "Ticket not found");
  }

  // Subtract exactly 2 hours from both createdAt and slaDeadline
  const newCreatedAt = new Date(ticket.createdAt.getTime() - 2 * 3600 * 1000);
  const newSlaDeadline = new Date(ticket.slaDeadline.getTime() - 2 * 3600 * 1000);

  // Update in database first so simulation is persistent
  let updatedTicket = await context.entities.Ticket.update({
    where: { id: args.ticketId },
    data: {
      createdAt: newCreatedAt,
      slaDeadline: newSlaDeadline
    },
    include: {
      assignee: true,
      creator: true
    }
  });

  // Check if SLA has been breached
  const now = new Date();
  if (updatedTicket.slaDeadline < now && updatedTicket.status !== 'RESOLVED' && !updatedTicket.isEscalated) {
    const managers = await context.entities.User.findMany({
      where: { role: 'MANAGER' },
      orderBy: { id: 'asc' }
    });

    let newAssigneeId = updatedTicket.assigneeId;
    if (managers.length > 0) {
      newAssigneeId = managers[0].id;
    }

    updatedTicket = await context.entities.Ticket.update({
      where: { id: args.ticketId },
      data: {
        isEscalated: true,
        assigneeId: newAssigneeId
      },
      include: {
        assignee: true,
        creator: true
      }
    });
  }

  return updatedTicket;
};
