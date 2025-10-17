import { createStackApp } from '@stackframe/stack';

// Initialize the server-side Stack app instance
export const stackServerApp = createStackApp({
  isServer: true, // Explicitly configure for server-side
  projectId: process.env.STACK_PROJECT_ID as string, // Replace with your actual project ID environment variable
  apiKey: process.env.STACK_SERVER_API_KEY as string, // Replace with your actual server API key environment variable
  // Add other necessary config options as per Stack documentation
  // For example:
  // redirectUrl: process.env.NEXT_PUBLIC_REDIRECT_URL as string,
  // cookieOptions: { ... },
});