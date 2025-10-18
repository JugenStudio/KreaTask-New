import { StackAuth } from '@stackframe/stack';

const stack = StackAuth();

// Ekspor handler yang TEPAT untuk GET dan POST
export const { GET, POST } = stack;