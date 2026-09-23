import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, TokenPayload } from './auth';
import { Role } from '@realestate-crm/shared';

export type AuthenticatedHandler = (
  req: NextRequest,
  context: { params?: Record<string, string | string[]>; user: TokenPayload }
) => Promise<NextResponse>;

export function withAuth(
  handler: AuthenticatedHandler,
  options?: { roles?: Role[] }
) {
  return async (req: NextRequest, { params }: { params?: Record<string, string | string[]> } = {}) => {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: Session missing or expired' },
          { status: 401 }
        );
      }

      if (options?.roles && !options.roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient role permissions' },
          { status: 403 }
        );
      }

      return await handler(req, { params, user });
    } catch (error: any) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: error?.message || 'Internal Server Error' },
        { status: error?.status || 500 }
      );
    }
  };
}
