'use client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export default function AdminsisLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <LoginForm variant="admin" />
    </Suspense>
  );
}
