'use client';
import Link from 'next/link';
import { CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shown whenever a dashboard page gets a 403 (no active plan / missing plan permission).
 */
export default function NoPlanBanner({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
        <Lock className="w-9 h-9 text-amber-500" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-bold text-gray-900">
          {title || 'Sin acceso a este módulo'}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          {description || 'Tu plan no tiene permiso para usar este módulo o aún no cuentas con un plan activo. Elige un plan para desbloquearlo.'}
        </p>
      </div>
      <Link href="/dashboard/subscription">
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          <CreditCard className="w-4 h-4" />
          Elegir un plan
        </Button>
      </Link>
    </div>
  );
}
