'use client';

import { stackServerApp } from '@/lib/stack';
import { StackAuth } from '@stackframe/stack/nextjs';

export const { GET, POST } = StackAuth(stackServerApp);
