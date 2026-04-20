'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import api from '@/lib/api';

export default function TimelineChart({ invitationId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invitationId) return;
    setLoading(true);
    api.get(`/guests/invitation/${invitationId}/timeline`)
      .then(r => setData(r.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [invitationId]);

  // Accumulate totals day by day for a nicer visualization
  const chartData = (() => {
    let conf = 0, dec = 0;
    return data.map(d => {
      conf += d.confirmed;
      dec  += d.declined;
      return {
        date: new Date(d.date).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
        Confirmados: conf,
        Declinaron: dec,
      };
    });
  })();

  if (loading) {
    return <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />;
  }

  if (!chartData.length) {
    return (
      <div className="border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Aún no hay respuestas RSVP para graficar.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorDec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Confirmados" stroke="#10b981" fill="url(#colorConf)" strokeWidth={2} />
          <Area type="monotone" dataKey="Declinaron"  stroke="#ef4444" fill="url(#colorDec)"  strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
