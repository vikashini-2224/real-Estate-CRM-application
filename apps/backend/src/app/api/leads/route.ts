import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/api-guard';
import { prisma } from '../../../lib/prisma';
import { CreateLeadSchema, Role } from '@realestate-crm/shared';

// GET /api/leads - Filterable list of leads
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const stage = searchParams.get('stage')?.trim() || '';
  const assignedToId = searchParams.get('assignedToId')?.trim() || '';
  const myLeadsOnly = searchParams.get('myLeads') === 'true';

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { requirement: { contains: search } },
    ];
  }

  if (stage) {
    where.stage = stage;
  }

  if (user.role === Role.SALES_EMPLOYEE) {
    where.assignedToId = user.id;
  } else if (myLeadsOnly) {
    where.assignedToId = user.id;
  } else if (assignedToId) {
    where.assignedToId = assignedToId === 'unassigned' ? null : assignedToId;
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
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
        },
      },
      _count: {
        select: { notes: true },
      },
      interestedProject: {
        select: { id: true, name: true, location: true },
      },
      interestedBuilding: {
        select: { id: true, name: true },
      },
      interestedUnit: {
        select: { id: true, unitNumber: true, type: true, price: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      followUpDate: l.followUpDate?.toISOString() || null,
      notesCount: l._count.notes,
    })),
  });
});

// POST /api/leads - Create new lead
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = CreateLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Hierarchy Validation
  if (data.interestedUnitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: data.interestedUnitId },
      include: { building: true },
    });
    if (!unit) return NextResponse.json({ error: 'Invalid interested unit' }, { status: 400 });
    
    if (data.interestedBuildingId && data.interestedBuildingId !== unit.buildingId) {
      return NextResponse.json({ error: 'Unit does not belong to the selected building' }, { status: 400 });
    }
    if (data.interestedProjectId && data.interestedProjectId !== unit.building.projectId) {
      return NextResponse.json({ error: 'Unit does not belong to the selected project' }, { status: 400 });
    }
    data.interestedBuildingId = unit.buildingId;
    data.interestedProjectId = unit.building.projectId;
  } else if (data.interestedBuildingId) {
    const building = await prisma.building.findUnique({
      where: { id: data.interestedBuildingId },
    });
    if (!building) return NextResponse.json({ error: 'Invalid interested building' }, { status: 400 });
    
    if (data.interestedProjectId && data.interestedProjectId !== building.projectId) {
      return NextResponse.json({ error: 'Building does not belong to the selected project' }, { status: 400 });
    }
    data.interestedProjectId = building.projectId;
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      stage: data.stage || 'NEW',
      budget: data.budget ?? null,
      requirement: data.requirement ?? null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      assignedToId: data.assignedToId || (user.role === Role.SALES_EMPLOYEE ? user.id : null),
      interestedProjectId: data.interestedProjectId || null,
      interestedBuildingId: data.interestedBuildingId || null,
      interestedUnitId: data.interestedUnitId || null,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      interestedProject: {
        select: { id: true, name: true, location: true },
      },
      interestedBuilding: {
        select: { id: true, name: true },
      },
      interestedUnit: {
        select: { id: true, unitNumber: true, type: true, price: true },
      },
    },
  });

  // Automatically create an initial note if requirement is provided
  if (data.requirement) {
    await prisma.note.create({
      data: {
        content: `Lead created with requirement: "${data.requirement}"`,
        leadId: lead.id,
        authorId: user.id,
      },
    });
  }

  return NextResponse.json(
    {
      lead: {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        followUpDate: lead.followUpDate?.toISOString() || null,
      },
    },
    { status: 201 }
  );
});
