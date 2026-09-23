import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';

// GET /api/properties/projects/[id] - Get project with buildings and units
export const GET = withAuth(async (_req: NextRequest, { params }) => {
  const id = params?.id as string;
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      buildings: {
        include: {
          units: {
            include: {
              booking: {
                include: {
                  lead: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
            },
            orderBy: { unitNumber: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({
    project: {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      buildings: project.buildings.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        units: b.units.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
          booking: u.booking
            ? {
                ...u.booking,
                bookingDate: u.booking.bookingDate.toISOString(),
                createdAt: u.booking.createdAt.toISOString(),
                updatedAt: u.booking.updatedAt.toISOString(),
              }
            : null,
        })),
      })),
    },
  });
});
