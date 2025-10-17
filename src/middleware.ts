export { auth as middleware } from "@/lib/auth"

// The middleware is now handled directly inside the auth config in src/lib/auth.ts
// using the `authorized` callback. This file is kept for explicitness and to
// potentially add more middleware logic in the future if needed.
// By exporting `auth` from our auth config, we apply NextAuth middleware to the entire project.
// The matcher is no longer needed here as the logic is in the `authorized` callback.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - landing page, signin, signup
     */
    '/((?!api|_next/static|_next/image|favicon.ico|landing|signin|signup).*)',
  ],
}
