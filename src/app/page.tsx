"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStackApp } from '@stackframe/stack';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const stack = useStackApp();

  useEffect(() => {
    if (stack.loading) {
      return;
    }
    if (stack.authenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/landing');
    }
  }, [stack.authenticated, stack.loading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
