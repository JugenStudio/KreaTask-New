'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useLanguage } from '@/providers/language-provider';

const signinSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password diperlukan"),
});

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signinSchema.safeParse({ email, password });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch('/handler/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login gagal');

      router.push('/dashboard'); // login sukses
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder={t('signin.email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('signin.password_placeholder')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-12">
          {isLoading ? <Loader2 className="animate-spin" /> : t('signin.submit_button')}
        </Button>
      </form>

      <p className="text-center mt-4">
        {t('signin.no_account')}{' '}
        <Link href="/signup" className="text-blue-500">{t('signin.signup_link')}</Link>
      </p>
    </div>
  );
}
