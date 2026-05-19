'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Genera dos números aleatorios para la suma.
 * Rango: 1-20 para que sea fácil pero no trivial.
 */
function generateChallenge() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  return { a, b, answer: a + b };
}

/**
 * Componente de captcha matemático.
 * Muestra una suma de dos números y valida la respuesta del usuario.
 *
 * Importante: el reto se genera en useEffect (no en useState con función)
 * para evitar mismatches de hidratación de Next.js — Math.random() en el
 * servidor produce un valor distinto al del cliente.
 *
 * @param {{ onValidChange: (isValid: boolean) => void, variant?: 'default' | 'admin' }} props
 */
export default function MathCaptcha({ onValidChange, variant = 'default' }) {
  const [challenge, setChallenge] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const isAdmin = variant === 'admin';

  // Generar el reto sólo en cliente, después de hidratación
  useEffect(() => {
    setChallenge(generateChallenge());
  }, []);

  const regenerate = useCallback(() => {
    setChallenge(generateChallenge());
    setUserAnswer('');
    setError('');
    setVerified(false);
    onValidChange(false);
  }, [onValidChange]);

  // Validar cuando el usuario escribe
  useEffect(() => {
    if (!challenge) return;

    if (userAnswer === '') {
      setError('');
      setVerified(false);
      onValidChange(false);
      return;
    }

    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed)) {
      setError('Ingresa un número válido');
      setVerified(false);
      onValidChange(false);
      return;
    }

    if (parsed === challenge.answer) {
      setError('');
      setVerified(true);
      onValidChange(true);
    } else {
      setError('Respuesta incorrecta');
      setVerified(false);
      onValidChange(false);
    }
  }, [userAnswer, challenge, onValidChange]);

  const borderColor = verified
    ? 'border-green-400 ring-1 ring-green-200'
    : error
      ? 'border-red-400 ring-1 ring-red-200'
      : '';

  const bgColor = isAdmin
    ? 'bg-slate-800 border border-slate-600'
    : 'bg-violet-100 border border-violet-300';

  const textColor = isAdmin
    ? 'text-amber-400'
    : 'text-violet-700';

  const numbersColor = isAdmin
    ? 'text-white font-bold'
    : 'text-violet-900 font-bold';

  return (
    <div className={`rounded-xl p-3 ${bgColor} space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className={`w-4 h-4 ${textColor}`} />
          <Label className={`text-sm font-medium ${textColor}`}>
            Verificación de seguridad
          </Label>
        </div>
        <button
          type="button"
          onClick={regenerate}
          className={`p-1 rounded-md hover:bg-black/10 transition-colors ${textColor}`}
          title="Generar nueva operación"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-lg ${numbersColor} select-none`}>
          {challenge
            ? <>¿Cuánto es {challenge.a} + {challenge.b}?</>
            : <span className="opacity-50">Cargando...</span>
          }
        </span>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="?"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={!challenge}
          className={`w-20 text-center font-mono text-lg ${borderColor}`}
          aria-label={challenge ? `Resultado de ${challenge.a} más ${challenge.b}` : 'Resultado'}
        />
        {verified && (
          <span className="text-green-500 text-sm font-medium">✓</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
