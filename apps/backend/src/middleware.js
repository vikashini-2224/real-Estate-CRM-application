import { NextResponse } from "next/server";

export function middleware(request) {
  const origin = request.headers.get("origin");
  // Create response
  const response = NextResponse.next();

  // Define allowed origins
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://frontend-vikashini.vercel.app"
  ];

  // Check if origin is allowed, or default to the Vercel app in production
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const allowedOrigin = isAllowedOrigin ? origin : (process.env.FRONTEND_URL || "https://frontend-vikashini.vercel.app");

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,DELETE,PATCH,POST,PUT,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  );

  // Handle preflight OPTIONS requests directly
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
