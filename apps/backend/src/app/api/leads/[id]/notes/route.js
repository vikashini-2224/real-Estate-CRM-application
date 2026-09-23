import { NextResponse } from "next/server";
import { withAuth } from "../../../../../lib/api-guard";
import { prisma } from "../../../../../lib/prisma";
import { CreateNoteSchema } from "@realestate-crm/shared";

// POST /api/leads/[id]/notes - Add note to lead
export const POST = withAuth(async (req, { params, user }) => {
  const leadId = params?.id;
  if (!leadId) {
    return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = CreateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Note content is required", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const note = await prisma.note.create({
    data: {
      content: parsed.data.content,
      leadId,
      authorId: user.id,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json(
    {
      note: {
        ...note,
        createdAt: note.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
});
