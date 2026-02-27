// import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Temporarily disabled middleware for testing
// export default withAuth(

export function middleware(req: { nextUrl: { pathname: string } }) {
  return NextResponse.next();
}

// );

export const config = {
  matcher: [
    "/modules/:path*", 
    "/api/:path*"
  ],
};
