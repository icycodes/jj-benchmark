import type { CreateTicket, SimulateSlaBreach } from "wasp/server/operations";
import { HttpError } from "wasp/server";

type CreateTicketInput = {
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export const createTicket: CreateTicket<CreateTicketInput, any> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { title, description, priority } = args;
  if (!title || !description || !priority) {
    throw new HttpError(400, "Missing required fields");
  }

  // Calculate SLA deadline
  const now = new Date();
  let seconds = 24 * 3600; // LOW
  if (priority === "HIGH") {
    seconds = 3600;
  } else if (priority === "MEDIUM") {
    seconds = 4 * 3600;
  }
  const slaDeadline = new Date(now.getTime() + seconds * 1000);

  // Find agent with lowest workload
  const agents = await context.entities.User.findMany({
    where: {
      role: "AGENT",
    },
    include: {
      tickets: {
        where: {
          status: {
            not: "RESOLVED",
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  let assigneeId: number | null = null;
  if (agents.length > 0) {
    const sortedAgents = [...agents].sort((a, b) => {
      const workloadA = a.tickets.length;
      const workloadB = b.tickets.length;
      if (workloadA !== workloadB) {
        return workloadA - workloadB;
      }
      return a.id - b.id;
    });
    assigneeId = sortedAgents[0].id;
  }

  return context.entities.Ticket.create({
    data: {
      title,
      description,
      priority,
      slaDeadline,
      creatorId: context.user.id,
      assigneeId,
    },
    include: {
      assignee: true,
      creator: true,
    },
  });
};

type SimulateSlaBreachInput = {
  ticketId: number;
};

export const simulateSlaBreach: SimulateSlaBreach<
  SimulateSlaBreachInput,
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

  // Subtract exactly 2 hours (2 * 3600 * 1000 ms) from both createdAt and slaDeadline
  const TWO_HOURS_MS = 2 * 3600 * 1000;
  const newCreatedAt = new Date(ticket.createdAt.getTime() - TWO_HOURS_MS);
  const newSlaDeadline = new Date(ticket.slaDeadline.getTime() - TWO_HOURS_MS);

  // Update in database first
  let updatedTicket = await context.entities.Ticket.update({
    where: { id: args.ticketId },
    data: {
      createdAt: newCreatedAt,
      slaDeadline: newSlaDeadline,
    },
    include: {
      assignee: true,
      creator: true,
    },
  });

  // Then check if breached: slaDeadline is in the past, status is not "RESOLVED", and isEscalated is false
  const now = new Date();
  if (
    newSlaDeadline < now &&
    updatedTicket.status !== "RESOLVED" &&
    !updatedTicket.isEscalated
  ) {
    // Find manager with smallest id
    const managers = await context.entities.User.findMany({
      where: { role: "MANAGER" },
      orderBy: { id: "asc" },
    });

    const managerId = managers.length > 0 ? managers[0].id : undefined;

    const updateData: any = {
      isEscalated: true,
    };
    if (managerId !== undefined) {
      updateData.assigneeId = managerId;
    }

    updatedTicket = await context.entities.Ticket.update({
      where: { id: args.ticketId },
      data: updateData,
      include: {
        assignee: true,
        creator: true,
      },
    });
  }

  return updatedTicket;
};
