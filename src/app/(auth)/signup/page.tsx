'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useLanguage } from '@/providers/language-provider';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useStackApp } from '@stackframe/stack';

const signupSchema = z.object({
    name: z.string().min(1, "Nama lengkap diperlukan"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
});

export default function SignUpPage() {
  const router = useRouter();
  const stack = useStackApp();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

    const result = await stack.signUp({
      email,
      password,
      name,
    });

    if (result.error) {
      setErrors({ form: result.error.message });
      toast({
        variant: "destructive",
        title: "Pendaftaran Gagal",
        description: result.error.message,
      });
    } else {
      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun Anda telah dibuat. Silakan masuk.",
      });
      router.push(stack.urls.signIn);
    }
    
    setIsLoading(false);
  };
  
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    await stack.signIn('google');
    setIsGoogleLoading(false);
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className={cn("w-full rounded-2xl bg-card/60 backdrop-blur-lg shadow-2xl border border-white/10 overflow-hidden")}>
             
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-center bg-secondary/80 rounded-full p-1 max-w-fit mx-auto">
                         <Button variant="secondary" asChild className="rounded-full px-6 bg-primary text-primary-foreground shadow-md">
                            <Link href={stack.urls.signUp}>{t('signup.signup_button')}</Link>
                        </Button>
                        <Button variant="ghost" asChild className="rounded-full px-6 text-muted-foreground">
                            <Link href={stack.urls.signIn}>{t('signup.signin_button')}</Link>
                        </Button>
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-xl font-bold font-headline">{t('signup.title')}</h1>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                            type="text"
                            placeholder={t('signup.name_placeholder')}
                            className="pl-10 h-12 bg-background/30 border-white/10 placeholder:text-muted-foreground"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading || isGoogleLoading}
                            />
                            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                            type="email"
                            placeholder={t('signup.email_placeholder')}
                            className="pl-10 h-12 bg-background/30 border-white/10 placeholder:text-muted-foreground"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading || isGoogleLoading}
                            />
                            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('signup.password_placeholder')}
                            className="pl-10 pr-10 h-12 bg-background/30 border-white/10 placeholder:text-muted-foreground"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading || isGoogleLoading}
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </Button>
                            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                        </div>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t('signup.confirm_password_placeholder')}
                            className="pl-10 pr-10 h-12 bg-background/30 border-white/10 placeholder:text-muted-foreground"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading || isGoogleLoading}
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </Button>
                            {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                        </div>

                         {errors.form && <p className="text-sm text-center text-destructive">{errors.form}</p>}
                        
                        <Button
                            type="submit"
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-base"
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t('signup.submit_button')}
                        </Button>
                    </form>
                    
                    <div className="relative flex items-center">
                      <Separator className="flex-1" />
                      <span className="mx-4 text-xs text-muted-foreground">{t('signup.separator')}</span>
                      <Separator className="flex-1" />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full h-12"
                      onClick={handleGoogleSignUp}
                      disabled={isLoading || isGoogleLoading}
                    >
                       {isGoogleLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Image src="/google.svg" alt="Google logo" width={20} height={20} className="mr-2" />
                      )}
                      {t('signup.google_button')}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground !mt-8">
                        {t('signup.terms')}
                    </p>
                </div>
        </div>
    </div>
  );
}
