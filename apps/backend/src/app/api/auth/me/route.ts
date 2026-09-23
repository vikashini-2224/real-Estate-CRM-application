import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      // Return 200 with user: null to prevent console errors on initial load check
      return NextResponse.json({ user: null });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        ...dbUser,
        createdAt: dbUser.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('API Error in /me:', error);
    return NextResponse.json({ user: null });
  }
}
