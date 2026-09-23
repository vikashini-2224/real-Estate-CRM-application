import { NextResponse } from "next/server";
import { withAuth } from "../../../../lib/api-guard";
import { prisma } from "../../../../lib/prisma";
import { CreateBuildingSchema, Role } from "@realestate-crm/shared";

// POST /api/properties/buildings - Create building (ADMIN only)
export const POST = withAuth(
  async (req) => {
    const body = await req.json();
    const parsed = CreateBuildingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { name, projectId } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const building = await prisma.building.create({
      data: { name, projectId },
    });

    return NextResponse.json(
      {
        building: {
          ...building,
          createdAt: building.createdAt.toISOString(),
          updatedAt: building.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  },
  { roles: [Role.ADMIN] },
);
