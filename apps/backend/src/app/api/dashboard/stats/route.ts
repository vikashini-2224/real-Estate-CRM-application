import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { LeadStage } from '@realestate-crm/shared';

// GET /api/dashboard/stats - Sales and Inventory Analytics
export const GET = withAuth(async () => {
  const [
    totalLeads,
    leadsByStageRaw,
    leadsWithFollowUp,
    siteVisitsCount,
    bookings,
    units,
    recentLeads,
    upcomingFollowUps,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({
      by: ['stage'],
      _count: { _all: true },
    }),
    prisma.lead.count({
      where: {
        followUpDate: {
          not: null,
          gte: new Date(Date.now() - 24 * 3600 * 1000),
        },
      },
    }),
    prisma.lead.count({
      where: { stage: 'SITE_VISIT' },
    }),
    prisma.booking.findMany({
      select: { bookingAmount: true, finalPrice: true },
    }),
    prisma.unit.findMany({
      select: { status: true },
    }),
    prisma.lead.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.lead.findMany({
      where: {
        followUpDate: {
          gte: new Date(),
        },
      },
      take: 5,
      orderBy: { followUpDate: 'asc' },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  // Normalize stages
  const defaultStages: Record<string, number> = {
    [LeadStage.NEW]: 0,
    [LeadStage.CONTACTED]: 0,
    [LeadStage.SITE_VISIT]: 0,
    [LeadStage.INTERESTED]: 0,
    [LeadStage.NEGOTIATION]: 0,
    [LeadStage.BOOKED]: 0,
    [LeadStage.LOST]: 0,
  };

  leadsByStageRaw.forEach((item) => {
    if (item.stage in defaultStages) {
      defaultStages[item.stage] = item._count._all;
    }
  });

  const totalRevenue = bookings.reduce((acc, b) => acc + (b.finalPrice || 0), 0);
  const totalBookings = bookings.length;
  const availableUnits = units.filter((u) => u.status === 'AVAILABLE').length;
  const totalUnits = units.length;

  return NextResponse.json({
    stats: {
      totalLeads,
      leadsByStage: defaultStages,
      followUpsCount: leadsWithFollowUp,
      siteVisitsCount,
      totalBookings,
      totalRevenue,
      availableUnits,
      totalUnits,
      recentLeads: recentLeads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        followUpDate: l.followUpDate?.toISOString() || null,
      })),
      upcomingFollowUps: upcomingFollowUps.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        followUpDate: l.followUpDate?.toISOString() || null,
      })),
    },
  });
});
