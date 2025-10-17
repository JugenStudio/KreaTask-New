'use client';

import { StackProvider } from '@stackframe/stack';
import type { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <StackProvider>{children}</StackProvider>;
}
