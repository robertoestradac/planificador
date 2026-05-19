'use client';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tarjeta personalizada del tour con estilo shadcn / violeta.
 * NextStepjs renderiza este componente y le pasa estos props:
 *
 *   step           : el step actual (con icon, title, content)
 *   currentStep    : índice actual (0-based)
 *   totalSteps     : total de steps en el tour
 *   nextStep       : avanzar
 *   prevStep       : retroceder
 *   skipTour       : saltar y cerrar
 *   arrow          : flecha del tooltip (renderizado por la librería)
 */
export default function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
  nextDisabled = false,
}) {
  const isFirst = currentStep === 0;
  const isLast  = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-violet-100 p-5 max-w-sm w-[340px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl shadow-md">
            {step?.icon || <Sparkles className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
              Paso {currentStep + 1} de {totalSteps}
            </p>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{step?.title}</h3>
          </div>
        </div>
        <button
          onClick={skipTour}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1 flex-shrink-0"
          aria-label="Cerrar tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{step?.content}</p>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={skipTour}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          Saltar tour
        </button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button size="sm" variant="outline" onClick={prevStep} className="gap-1 h-8">
              <ChevronLeft className="w-3.5 h-3.5" />
              Atrás
            </Button>
          )}
          <Button
            size="sm"
            onClick={isLast ? skipTour : nextStep}
            disabled={nextDisabled && !isLast}
            className="gap-1 h-8 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={nextDisabled && !isLast ? 'Completa el campo para continuar' : undefined}
          >
            {isLast ? 'Finalizar' : 'Siguiente'}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {nextDisabled && !isLast && (
        <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
          <span>!</span> Completa el campo para continuar
        </p>
      )}

      {arrow}
    </div>
  );
}
