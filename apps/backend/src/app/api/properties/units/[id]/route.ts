import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/api-guard';
import { prisma } from '../../../../../lib/prisma';
import { UpdateUnitSchema, Role } from '@realestate-crm/shared';

// PATCH /api/properties/units/[id] - Update unit (ADMIN only)
export const PATCH = withAuth(
  async (req: NextRequest, { params }) => {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateUnitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const existing = await prisma.unit.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    if (parsed.data.status && parsed.data.status !== existing.status && existing.booking) {
      return NextResponse.json(
        { error: 'Cannot change status of a currently booked unit directly. Cancel the booking instead.' },
        { status: 400 }
      );
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: parsed.data,
      include: {
        building: {
          include: { project: true },
        },
      },
    });

    return NextResponse.json({
      unit: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  },
  { roles: [Role.ADMIN] }
);
