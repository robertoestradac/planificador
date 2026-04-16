'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import AppBranding, { useAppSettings } from '@/components/layout/AppBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login    = useAuthStore((s) => s.login);
  const verify2FA = useAuthStore((s) => s.verify2FA);
  const settings = useAppSettings();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [step, setStep] = useState('credentials');
  const [totpCode, setTotpCode] = useState('');

  const redirectUser = (user) => {
    const redirect = searchParams.get('redirect');
    if (['SuperAdmin', 'Admin', 'Support'].includes(user.role)) {
      router.push(redirect || '/admin');
    } else {
      router.push(redirect || '/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result?.require2fa) {
        setStep('2fa');
        return;
      }
      redirectUser(result);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: err.response?.data?.message || 'Credenciales inválidas',
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verify2FA(totpCode.replace(/\s/g, ''));
      redirectUser(user);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Código incorrecto',
        description: err.response?.data?.message || 'Verifica el código e intenta de nuevo',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === '2fa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="w-full max-w-md px-4">
          <div className="flex flex-col items-center mb-8">
            <AppBranding size="lg" showTagline className="flex-col !gap-2 text-center" />
          </div>
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-violet-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Verificación 2FA</CardTitle>
              <CardDescription className="text-center">
                Ingresa el código de 6 dígitos de tu app autenticadora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totp">Código de verificación</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totp"
                      type="text"
                      inputMode="numeric"
                      placeholder="123 456"
                      className="pl-9 text-center text-2xl tracking-[0.4em] font-mono"
                      maxLength={7}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || totpCode.replace(/\s/g,'').length < 6}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : 'Verificar e ingresar'}
                </Button>
                <button type="button" onClick={() => { setStep('credentials'); setTotpCode(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  ← Volver al inicio de sesión
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8">
          <AppBranding size="lg" showTagline className="flex-col !gap-2 text-center" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="pl-9"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>

            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
                <p className="font-semibold">Credenciales de prueba:</p>
                <p>SuperAdmin: superadmin@invitaciones.app / Admin@1234!</p>
                <p>Cliente demo: owner@demo.com / Demo@1234!</p>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              No tienes cuenta?{' '}
              <a href="/register" className="text-violet-600 hover:underline font-medium">Regístrate gratis</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
