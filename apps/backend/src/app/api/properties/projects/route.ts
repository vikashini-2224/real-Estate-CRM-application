import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/api-guard';
import { prisma } from '../../../../lib/prisma';
import { CreateProjectSchema, Role } from '@realestate-crm/shared';

// GET /api/properties/projects - List all projects with building and unit counts
export const GET = withAuth(async () => {
  const projects = await prisma.project.findMany({
    include: {
      buildings: {
        include: {
          units: {
            select: { id: true, status: true, price: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = projects.map((p) => {
    let totalUnits = 0;
    let availableUnits = 0;
    let bookedUnits = 0;

    p.buildings.forEach((b) => {
      b.units.forEach((u) => {
        totalUnits++;
        if (u.status === 'AVAILABLE') availableUnits++;
        if (u.status === 'BOOKED') bookedUnits++;
      });
    });

    return {
      id: p.id,
      name: p.name,
      location: p.location,
      description: p.description,
      buildingsCount: p.buildings.length,
      totalUnits,
      availableUnits,
      bookedUnits,
      buildings: p.buildings.map((b) => ({
        id: b.id,
        name: b.name,
        projectId: b.projectId,
        unitsCount: b.units.length,
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ projects: formatted });
});

// POST /api/properties/projects - Create new project (ADMIN only)
export const POST = withAuth(
  async (req: NextRequest) => {
    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        location: parsed.data.location,
        description: parsed.data.description || null,
      },
    });

    return NextResponse.json(
      {
        project: {
          ...project,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  },
  { roles: [Role.ADMIN] }
);
