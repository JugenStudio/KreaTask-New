import { auth } from '@/lib/auth'; // Import only the edge-safe auth helper

// The `auth` function is a higher-order function that returns a middleware.
// It verifies the JWT from cookies and protects routes without touching the database.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

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
    const redirectUrl = new URL('/landing', nextUrl.origin);
    redirectUrl.searchParams.append('callbackUrl', nextUrl.pathname);
    return Response.redirect(redirectUrl);
  }
  
  // If the route is not protected, or if the user is logged in, continue.
  return;
});

// The matcher configuration tells the middleware which paths to run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sounds (public audio files)
     * - landing (public landing page)
     */
    '/((?!api|_next/static|_next/image|sounds|favicon.ico|landing|signin|signup).*)',
  ],
};