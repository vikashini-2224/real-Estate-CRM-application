import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth } from "../../../lib/api-guard";
import { prisma } from "../../../lib/prisma";
import { CreateUserSchema, Role } from "@realestate-crm/shared";

// GET /api/users - List users
export const GET = withAuth(
  async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedLeads: true,
            bookings: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        assignedLeadsCount: u._count.assignedLeads,
        bookingsCount: u._count.bookings,
      })),
    });
  },
  { roles: [Role.ADMIN] },
);

// POST /api/users - Create new user (ADMIN only)
export const POST = withAuth(
  async (req) => {
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role || Role.SALES_EMPLOYEE,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  },
  { roles: [Role.ADMIN] },
);
