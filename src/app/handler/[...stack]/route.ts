
import { stackServerApp } from '@/stack';

const handler = stackServerApp.handler;

export { handler as GET, handler as POST };
