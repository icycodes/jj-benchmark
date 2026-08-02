import { type CreateTicket, type SimulateSlaBreach } from "wasp/server/operations";
import { HttpError } from "wasp/server";

export const createTicket: CreateTicket<
  { title: string; description: string; priority: "HIGH" | "MEDIUM" | "LOW" },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const now = new Date();
  let seconds = 24 * 3600; // default LOW
  if (args.priority === "HIGH") {
    seconds = 3600;
  } else if (args.priority === "MEDIUM") {
    seconds = 4 * 3600;
  } else if (args.priority === "LOW") {
    seconds = 24 * 3600;
  }
  const slaDeadline = new Date(now.getTime() + seconds * 1000);

  // Find all agents to determine workload
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

  let assigneeId: number | null = null;
  if (agents.length > 0) {
    // Sort agents by workload (ascending), then by ID (ascending)
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

  return context.entities.Ticket.create({
    data: {
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "OPEN",
      createdAt: now,
      slaDeadline,
      isEscalated: false,
      creator: { connect: { id: context.user.id } },
      assignee: assigneeId ? { connect: { id: assigneeId } } : undefined,
    },
    include: {
      assignee: true,
      creator: true,
    },
  });
};

export const simulateSlaBreach: SimulateSlaBreach<
  { ticketId: number },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const ticket = await context.entities.Ticket.findUnique({
    where: { id: args.ticketId },
  });
  if (!ticket) {
    throw new HttpError(404, "Ticket not found");
  }

  // Subtract exactly 2 hours (2 * 3600 * 1000 ms)
  const newCreatedAt = new Date(ticket.createdAt.getTime() - 2 * 3600 * 1000);
  const newSlaDeadline = new Date(ticket.slaDeadline.getTime() - 2 * 3600 * 1000);

  const now = new Date();
  // Check if SLA breached: newSlaDeadline is in the past, status is not RESOLVED, and isEscalated is false
  const isBreached = newSlaDeadline < now && ticket.status !== "RESOLVED" && !ticket.isEscalated;

  let newAssigneeId = ticket.assigneeId;
  let updateAssignee = false;

  if (isBreached) {
    const managers = await context.entities.User.findMany({
      where: {
        role: "MANAGER",
      },
      orderBy: {
        id: "asc",
      },
    });
    if (managers.length > 0) {
      newAssigneeId = managers[0].id;
      updateAssignee = true;
    }
  }

  const dataToUpdate: any = {
    createdAt: newCreatedAt,
    slaDeadline: newSlaDeadline,
  };

  if (isBreached) {
    dataToUpdate.isEscalated = true;
    if (updateAssignee) {
      dataToUpdate.assigneeId = newAssigneeId;
    }
  }

  return context.entities.Ticket.update({
    where: { id: args.ticketId },
    data: dataToUpdate,
    include: {
      assignee: true,
      creator: true,
    },
  });
};
