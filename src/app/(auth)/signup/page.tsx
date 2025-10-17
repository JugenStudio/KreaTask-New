'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useLanguage } from '@/providers/language-provider';

const signupSchema = z.object({
  name: z.string().min(1, "Nama lengkap diperlukan"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signupSchema.safeParse({ name, email, password, confirmPassword });
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
      const res = await fetch('/handler/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Pendaftaran gagal');

      toast({
        title: "Pendaftaran Berhasil",
        description: "Silakan login sekarang",
      });

      router.push('/signin');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Pendaftaran Gagal',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('signup.name_placeholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder={t('signup.email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('signup.password_placeholder')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12"
          />
          <Button type="button" variant="ghost" size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('signup.confirm_password_placeholder')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10 h-12"
          />
          <Button type="button" variant="ghost" size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>

        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : t('signup.submit_button')}
        </Button>
      </form>

      <p className="text-center mt-4">
        {t('signup.have_account')}{' '}
        <Link href="/signin" className="text-blue-500">{t('signup.signin_link')}</Link>
      </p>
    </div>
  );
}
