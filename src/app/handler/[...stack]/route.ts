import "server-only";
import { stackServerApp } from "@/lib/stack";

// The stackServerApp object has a built-in handler that manages all
// authentication-related requests (GET and POST).
const handler = stackServerApp.handler;

export { handler as GET, handler as POST };
