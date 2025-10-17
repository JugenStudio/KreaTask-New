import NextAuth from 'next-auth';
import { authConfig } from './auth.config'; // Import the EDGE-SAFE config

// Initialize NextAuth with the edge-safe configuration.
// This `auth` function is a middleware that will handle session verification on the edge.
export default NextAuth(authConfig).auth;

// The matcher configuration tells the middleware which paths to run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public assets (favicon, sounds, etc.)
     * - auth pages (landing, signin, signup)
     */
    '/((?!api|_next/static|_next/image|sounds|google.svg|favicon.ico|landing|signin|signup).*)',
  ],
};
