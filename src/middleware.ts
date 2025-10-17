import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // You can add logic here to perform role-based access control
    // For example, check req.nextauth.token.role
    // and redirect if they don't have access.
    // For now, we just protect the routes.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tasks/:path*',
    '/submit/:path*',
    '/leaderboard/:path*',
    '/performance-report/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/about/:path*',
    '/downloads/:path*',
  ],
};