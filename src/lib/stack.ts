import "server-only";
import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  // No need to specify projectId or apiKey here, they are read from environment variables.
});
