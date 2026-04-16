'use client';
import { useRouter } from 'next/navigation';
import { Mail, MessageSquare, Settings, ArrowRight } from 'lucide-react';

export default function AdminMarketingPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Módulos de Marketing</h1>
        <p className="text-gray-500 text-sm max-w-md">
          Los módulos han sido separados en aplicaciones dedicadas.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <button onClick={() => window.open('/wa', '_blank', 'noopener,noreferrer')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-[#25D366] bg-green-50 hover:bg-green-100 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shadow">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-gray-900">WhatsApp</p>
          <p className="text-xs text-gray-500">Business Marketing</p>
          <ArrowRight className="w-4 h-4 text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => window.open('/email', '_blank', 'noopener,noreferrer')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-gray-900">Email</p>
          <p className="text-xs text-gray-500">Marketing Suite</p>
          <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button onClick={() => router.push('/admin/settings')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-violet-500 bg-violet-50 hover:bg-violet-100 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center shadow">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-gray-900">SMTP</p>
          <p className="text-xs text-gray-500">Correos transaccionales</p>
          <ArrowRight className="w-4 h-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}