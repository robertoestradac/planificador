'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | already | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se encontró el token de verificación. Asegúrate de usar el enlace completo del email.');
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.post('/auth/verify-email', { token });
        const result = data.data;
        if (result.already_verified) {
          setStatus('already');
        } else {
          setStatus('success');
        }
        setMessage(result.message);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          'El enlace de verificación es inválido o ha expirado.'
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verificación de email</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">

            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                <p className="text-gray-500 text-sm">Verificando tu email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="w-14 h-14 text-green-500" />
                <CardTitle className="text-xl text-gray-900">¡Email verificado!</CardTitle>
                <CardDescription className="text-base">
                  {message || 'Tu cuenta está activa. Ya puedes iniciar sesión.'}
                </CardDescription>
                <Button
                  className="mt-2 w-full"
                  onClick={() => router.push('/login')}
                >
                  Ir al inicio de sesión
                </Button>
              </>
            )}

            {status === 'already' && (
              <>
                <CheckCircle2 className="w-14 h-14 text-blue-400" />
                <CardTitle className="text-xl text-gray-900">Ya verificado</CardTitle>
                <CardDescription className="text-base">
                  {message || 'Este email ya fue verificado anteriormente.'}
                </CardDescription>
                <Button
                  className="mt-2 w-full"
                  onClick={() => router.push('/login')}
                >
                  Ir al inicio de sesión
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-14 h-14 text-red-400" />
                <CardTitle className="text-xl text-gray-900">Enlace inválido</CardTitle>
                <CardDescription className="text-base text-red-600">
                  {message}
                </CardDescription>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/login')}
                  >
                    Volver al login
                  </Button>
                  <p className="text-xs text-gray-400">
                    Si el enlace expiró, inicia sesión y solicita un nuevo email de verificación.
                  </p>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
