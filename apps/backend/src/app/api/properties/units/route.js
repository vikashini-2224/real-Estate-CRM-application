import { NextResponse } from "next/server";
import { withAuth } from "../../../../lib/api-guard";
import { prisma } from "../../../../lib/prisma";
import { CreateUnitSchema, Role } from "@realestate-crm/shared";

// GET /api/properties/units - Filterable units list
export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId")?.trim();
  const buildingId = searchParams.get("buildingId")?.trim();
  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (buildingId) {
    where.buildingId = buildingId;
  } else if (projectId) {
    where.building = { projectId };
  }

  const units = await prisma.unit.findMany({
    where,
    include: {
      building: {
        include: {
          project: true,
        },
      },
      booking: {
        include: {
          lead: {
            select: { id: true, name: true, phone: true },
          },
        },
      },
    },
    orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
  });

  return NextResponse.json({
    units: units.map((u) => ({
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
  });
});

// POST /api/properties/units - Create unit (ADMIN only)
export const POST = withAuth(
  async (req) => {
    const body = await req.json();
    const parsed = CreateUnitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { unitNumber, type, price, buildingId, status } = parsed.data;

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) {
      return NextResponse.json(
        { error: "Building not found" },
        { status: 404 },
      );
    }

    const existingUnit = await prisma.unit.findUnique({
      where: {
        buildingId_unitNumber: {
          buildingId,
          unitNumber,
        },
      },
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: `Unit ${unitNumber} already exists in this building` },
        { status: 409 },
      );
    }

    const unit = await prisma.unit.create({
      data: {
        unitNumber,
        type,
        price,
        buildingId,
        status: status || "AVAILABLE",
      },
      include: {
        building: {
          include: { project: true },
        },
      },
    });

    return NextResponse.json(
      {
        unit: {
          ...unit,
          createdAt: unit.createdAt.toISOString(),
          updatedAt: unit.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  },
  { roles: [Role.ADMIN] },
);
