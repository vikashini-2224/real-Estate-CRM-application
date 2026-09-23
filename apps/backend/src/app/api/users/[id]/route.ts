import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { UpdateUserSchema, Role } from '@realestate-crm/shared';

// PATCH /api/users/[id] - Update user (ADMIN only)
export const PATCH = withAuth(
  async (req: NextRequest, { params }) => {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  },
  { roles: [Role.ADMIN] }
);
