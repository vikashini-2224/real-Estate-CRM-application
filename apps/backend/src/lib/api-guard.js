import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";

export function withAuth(handler, options) {
  return async (req, { params } = {}) => {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized: Session missing or expired" },
          { status: 401 },
        );
      }

      if (options?.roles && !options.roles.includes(user.role)) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient role permissions" },
          { status: 403 },
        );
      }

      return await handler(req, { params, user });
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: error?.status || 500 },
      );
    }
  };
}
