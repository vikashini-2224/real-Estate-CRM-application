import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { UpdateLeadSchema, Role } from '@realestate-crm/shared';

// GET /api/leads/[id] - Get full lead profile with notes & booking details
export const GET = withAuth(async (_req: NextRequest, { params }) => {
  const id = params?.id as string;
  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, role: true },
      },
      notes: {
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      booking: {
        include: {
          unit: {
            include: {
              building: {
                include: { project: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({
    lead: {
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      followUpDate: lead.followUpDate?.toISOString() || null,
      notes: lead.notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      booking: lead.booking
        ? {
            ...lead.booking,
            bookingDate: lead.booking.bookingDate.toISOString(),
            createdAt: lead.booking.createdAt.toISOString(),
            updatedAt: lead.booking.updatedAt.toISOString(),
          }
        : null,
    },
  });
});

// PATCH /api/leads/[id] - Update lead details, stage, assignment, follow-up date
export const PATCH = withAuth(async (req: NextRequest, { params, user }) => {
  const id = params?.id as string;
  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = UpdateLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.format() },
      { status: 400 }
    );
  }

  const existingLead = await prisma.lead.findUnique({ where: { id } });
  if (!existingLead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const data = parsed.data;
  const updatePayload: any = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.email !== undefined) updatePayload.email = data.email || null;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.budget !== undefined) updatePayload.budget = data.budget;
  if (data.requirement !== undefined) updatePayload.requirement = data.requirement;
  if (data.followUpDate !== undefined) {
    updatePayload.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
  }
  if (data.assignedToId !== undefined) {
    updatePayload.assignedToId = data.assignedToId || null;
  }

  // Handle stage change with audit note
  if (data.stage && data.stage !== existingLead.stage) {
    updatePayload.stage = data.stage;
    await prisma.note.create({
      data: {
        content: `Lead stage changed from ${existingLead.stage} to ${data.stage}.`,
        leadId: id,
        authorId: user.id,
      },
    });
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: updatePayload,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({
    lead: {
      ...updatedLead,
      createdAt: updatedLead.createdAt.toISOString(),
      updatedAt: updatedLead.updatedAt.toISOString(),
      followUpDate: updatedLead.followUpDate?.toISOString() || null,
    },
  });
});

// DELETE /api/leads/[id] - Delete lead (ADMIN only)
export const DELETE = withAuth(
  async (_req: NextRequest, { params }) => {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.booking) {
      return NextResponse.json(
        { error: 'Cannot delete lead with active booking. Cancel the booking first.' },
        { status: 400 }
      );
    }

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  },
  { roles: [Role.ADMIN] }
);
