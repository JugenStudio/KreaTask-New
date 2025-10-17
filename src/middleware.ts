import NextAuth from 'next-auth';
import { config } from '@/lib/auth'; // Import the config from our auth file

const { auth } = NextAuth(config);

// The `auth` function from NextAuth.js is a higher-order function that returns a middleware function.
// It automatically handles JWT verification from cookies and protects routes.
// It's designed to run on the Edge, so it does NOT access the database.
export default auth((req) => {
  // The `auth` property is attached to the request if the user is authenticated.
  // If `req.auth` is null, it means the user is not signed in.
  const isLoggedIn = !!req.auth;

  const { nextUrl } = req;
  
  // Define protected routes
  const protectedRoutes = [
      '/dashboard', 
      '/tasks', 
      '/submit', 
      '/leaderboard', 
      '/performance-report', 
      '/profile', 
      '/settings', 
      '/about', 
      '/downloads'
  ];

  const isProtectedRoute = protectedRoutes.some(path => nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !isLoggedIn) {
    // If the user is not logged in and is trying to access a protected route,
    // redirect them to the landing page.
    const redirectUrl = new URL('/landing', nextUrl.origin);
    // Optionally, you can add a callbackUrl to redirect them back after login
    redirectUrl.searchParams.append('callbackUrl', nextUrl.pathname);
    return Response.redirect(redirectUrl);
  }
  
  // If the user is logged in or the route is not protected, continue as normal.
  return;
});

// The matcher configuration tells the middleware which paths to run on.
export const config_matcher = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Public pages like /landing, /signin, /signup are intentionally included
     * so middleware can handle logic like redirecting logged-in users.
     */
    '/((?!api|_next/static|_next/image|sounds|favicon.ico).*)',
  ],
};
