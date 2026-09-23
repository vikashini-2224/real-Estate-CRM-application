import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/api-guard';
import { prisma } from '../../../../../lib/prisma';
import { Role } from '@realestate-crm/shared';

// POST /api/bookings/[id]/cancel - Cancel booking & release unit (ADMIN only)
export const POST = withAuth(
  async (_req: NextRequest, { params, user }) => {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id },
          include: { unit: true, lead: true },
        });

        if (!booking) {
          throw new Error('Booking record not found');
        }

        // Release the unit back to AVAILABLE
        await tx.unit.update({
          where: { id: booking.unitId },
          data: { status: 'AVAILABLE' },
        });

        // Update lead stage to NEGOTIATION
        await tx.lead.update({
          where: { id: booking.leadId },
          data: { stage: 'NEGOTIATION' },
        });

        // Record cancellation note
        await tx.note.create({
          data: {
            content: `Booking for Unit ${booking.unit.unitNumber} cancelled by admin (${user.name}). Unit released back to available inventory.`,
            leadId: booking.leadId,
            authorId: user.id,
          },
        });

        // Delete or update the booking record
        await tx.booking.delete({
          where: { id },
        });

        return { success: true, message: 'Booking cancelled and unit released successfully' };
      });

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to cancel booking' },
        { status: 500 }
      );
    }
  },
  { roles: [Role.ADMIN] }
);
