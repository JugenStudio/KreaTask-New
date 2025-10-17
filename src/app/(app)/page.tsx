"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@stackframe/stack';
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.loading) return; 

    if (auth.authenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/landing');
    }
  }, [auth.authenticated, auth.loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
