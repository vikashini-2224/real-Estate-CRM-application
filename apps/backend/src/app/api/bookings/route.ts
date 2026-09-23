import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { CreateBookingSchema, Role } from '@realestate-crm/shared';

// GET /api/bookings - List all bookings
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const where: any = {};

  // If sales employee, optionally filter or show their created/assigned bookings if requested
  const { searchParams } = new URL(req.url);
  const myBookingsOnly = searchParams.get('myBookings') === 'true';

  if (myBookingsOnly && user.role === Role.SALES_EMPLOYEE) {
    where.createdById = user.id;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      lead: {
        select: { id: true, name: true, email: true, phone: true, stage: true },
      },
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
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      ...b,
      bookingDate: b.bookingDate.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
  });
});

// POST /api/bookings - Concurrency-safe atomic unit booking
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { leadId, unitId, bookingAmount, finalPrice } = parsed.data;

  try {
    // Execute ACID transaction
    const bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch unit and verify status
      const unit = await tx.unit.findUnique({
        where: { id: unitId },
        include: { building: { include: { project: true } } },
      });

      if (!unit) {
        throw new Error('UNIT_NOT_FOUND: Unit does not exist');
      }

      if (unit.status !== 'AVAILABLE') {
        throw new Error('UNIT_UNAVAILABLE: This unit is already booked or reserved by another client.');
      }

      // 2. Fetch lead and verify lead eligibility
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        include: { booking: true },
      });

      if (!lead) {
        throw new Error('LEAD_NOT_FOUND: Lead record does not exist');
      }

      if (lead.booking) {
        throw new Error('LEAD_ALREADY_BOOKED: This lead already has an active property booking.');
      }

      // 3. Mark unit status to BOOKED and increment version
      await tx.unit.update({
        where: { id: unitId },
        data: {
          status: 'BOOKED',
          version: { increment: 1 },
        },
      });

      // 4. Create the booking record (enforced unique unitId and unique leadId)
      const booking = await tx.booking.create({
        data: {
          leadId,
          unitId,
          bookingAmount,
          finalPrice,
          createdById: user.id,
          status: 'CONFIRMED',
        },
        include: {
          lead: true,
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
      });

      // 5. Update lead stage to BOOKED
      await tx.lead.update({
        where: { id: leadId },
        data: {
          stage: 'BOOKED',
        },
      });

      // 6. Record audit note
      await tx.note.create({
        data: {
          content: `Unit ${unit.unitNumber} (${unit.building.project.name} - ${unit.building.name}) officially booked for ₹${finalPrice.toLocaleString('en-IN')} with initial token ₹${bookingAmount.toLocaleString('en-IN')}.`,
          leadId: lead.id,
          authorId: user.id,
        },
      });

      return booking;
    });

    return NextResponse.json(
      {
        booking: {
          ...bookingResult,
          bookingDate: bookingResult.bookingDate.toISOString(),
          createdAt: bookingResult.createdAt.toISOString(),
          updatedAt: bookingResult.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Booking Transaction Error:', error.message);

    // Prisma Unique constraint violation (P2002) or custom concurrency errors
    if (
      error.code === 'P2002' ||
      error.message?.includes('UNIT_UNAVAILABLE') ||
      error.message?.includes('LEAD_ALREADY_BOOKED')
    ) {
      let cleanMessage = 'This unit has already been booked by another user.';
      if (error.message?.includes('LEAD_ALREADY_BOOKED')) {
        cleanMessage = 'This lead already has an active property booking.';
      }
      return NextResponse.json(
        {
          error: cleanMessage,
          code: 'CONCURRENCY_CONFLICT',
        },
        { status: 409 }
      );
    }

    if (error.message?.includes('NOT_FOUND')) {
      return NextResponse.json(
        { error: error.message.replace(/^.*:\s*/, '') },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to complete booking transaction' },
      { status: 500 }
    );
  }
});
