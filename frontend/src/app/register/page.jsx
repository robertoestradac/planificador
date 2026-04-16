'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';

function RegisterForm() {
  const router  = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/auth/register', { ...form, company_name: form.name });
      const { accessToken, refreshToken, user } = data.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      document.cookie = `access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
      document.cookie = `session_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
      useAuthStore.setState({ user, accessToken, refreshToken, isAuthenticated: true });
      toast({ title: `Bienvenido, ${user.name}!`, description: 'Tu cuenta fue creada exitosamente.' });
      router.push('/dashboard');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Error al crear cuenta' });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Crea tu cuenta</h1>
          <p className="text-gray-500 mt-2 text-sm">Empieza a crear invitaciones digitales</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tu nombre completo</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Juan Garcia" className="mt-1" />
              </div>
              <div>
                <Label>Correo electronico</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="juan@empresa.com" className="mt-1" />
              </div>
              <div>
                <Label>{'Contrase\u00f1a'}</Label>
                <div className="relative mt-1">
                  <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Minimo 8 caracteres" minLength={8} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm text-violet-700">
                {'Podr\u00e1s solicitar un plan desde tu panel una vez registrado.'}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando cuenta...</> : 'Crear cuenta'}
              </Button>

              <p className="text-center text-sm text-gray-500">
                {'¿Ya tienes cuenta? '}
                <Link href="/login" className="text-violet-600 hover:underline font-medium">{'Inicia sesi\u00f3n'}</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
