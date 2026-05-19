'use client';
import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NextStep, NextStepProvider, useNextStep } from 'nextstepjs';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { ONBOARDING_TOUR } from '@/lib/tour/onboardingSteps';
import TourCard from './TourCard';

const STORAGE_KEY = 'onboarding:main-tour';

// --- Persistencia en localStorage ---
const persist = {
  read() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - (parsed.ts || 0) > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },
  write(data) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
    } catch {}
  },
  clear() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};

// --- Validacion de campos requeridos ---
function isFieldFilled(selector) {
  if (typeof window === 'undefined') return true;
  const el = document.querySelector(selector);
  if (!el) return true;
  const value = el.value;
  return typeof value === 'string' && value.trim() !== '';
}

// Selectores de elementos donde un click avanza el tour
const AUTO_ADVANCE_SELECTORS = new Set([
  '[data-tour="nav-events"]',
  '[data-tour="create-event-btn"]',
  '[data-tour="event-submit-btn"]',
  '[data-tour="nav-invitations"]',
  '[data-tour="create-invitation-btn"]',
  '[data-tour="invitation-submit-btn"]',
  '[data-tour="invitation-builder-btn"]',
]);

// Selectores cuyo click solo debe avanzar si el formulario es valido
const VALIDATE_FORM_BEFORE_ADVANCE = new Set([
  '[data-tour="event-submit-btn"]',
  '[data-tour="invitation-submit-btn"]',
]);

// --- Context para compartir el guard con el TourCard ---
const TourGuardContext = createContext({ requiredSelector: null, filled: true });

function useTourGuard() {
  return useContext(TourGuardContext);
}

/**
 * Componente del card que respeta el guard de campos requeridos.
 */
function GuardedTourCard(props) {
  const guard = useTourGuard();
  const lockNext = !!(guard.requiredSelector && !guard.filled);

  const handleNext = () => {
    if (lockNext) {
      const el = document.querySelector(guard.requiredSelector);
      if (el) {
        if (typeof el.focus === 'function') el.focus();
        el.classList.add('ring-2', 'ring-red-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-red-400'), 1200);
      }
      return;
    }
    props.nextStep();
  };

  return <TourCard {...props} nextStep={handleNext} nextDisabled={lockNext} />;
}

/**
 * Auto-arranca, persiste y reanuda el tour.
 */
function OnboardingAutoStart({ onGuardChange }) {
  const {
    startNextStep,
    setCurrentStep,
    closeNextStep,
    currentTour,
    currentStep,
    isNextStepVisible,
  } = useNextStep();

  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  // Refrescar user al montar
  useEffect(() => {
    fetchMe().catch(() => {});
  }, [fetchMe]);

  // Auto-iniciar / reanudar
  useEffect(() => {
    if (startedRef.current) return;
    if (!user) return;
    if (!user.tenant_id) return;

    const saved = persist.read();
    if (saved && saved.tour === 'main-tour' && typeof saved.step === 'number') {
      startedRef.current = true;
      const t = setTimeout(() => {
        startNextStep('main-tour');
        setTimeout(() => setCurrentStep(saved.step, 0), 300);
      }, 600);
      return () => clearTimeout(t);
    }

    if (user.onboarding_completed) return;
    startedRef.current = true;
    const t = setTimeout(() => startNextStep('main-tour'), 600);
    return () => clearTimeout(t);
  }, [user, startNextStep, setCurrentStep]);

  // Persistir paso actual
  useEffect(() => {
    if (!isNextStepVisible || currentTour !== 'main-tour') return;
    persist.write({ tour: currentTour, step: currentStep });
  }, [currentStep, currentTour, isNextStepVisible]);

  // Limpiar al cerrar / completar
  useEffect(() => {
    if (currentTour === null && startedRef.current && !completedRef.current) {
      completedRef.current = true;
      persist.clear();
      api.post('/auth/onboarding/complete')
        .then(() => fetchMe())
        .catch(() => {});
    }
  }, [currentTour, fetchMe]);

  // Step actual (memoizado por indice)
  const currentStepDef =
    isNextStepVisible && currentTour === 'main-tour'
      ? ONBOARDING_TOUR.find((t) => t.tour === 'main-tour')?.steps[currentStep]
      : null;

  // Selectores estables para usar como deps
  const requiredSelector = currentStepDef?.requireField || null;
  const stepSelector = currentStepDef?.selector || null;
  const isAdvanceTarget = stepSelector ? AUTO_ADVANCE_SELECTORS.has(stepSelector) : false;
  const requireFormValid = stepSelector ? VALIDATE_FORM_BEFORE_ADVANCE.has(stepSelector) : false;

  // Calcular el guard del campo requerido
  useEffect(() => {
    if (!requiredSelector) {
      onGuardChange({ requiredSelector: null, filled: true });
      return;
    }

    const update = () => {
      onGuardChange({
        requiredSelector,
        filled: isFieldFilled(requiredSelector),
      });
    };

    update();

    const handler = () => update();
    document.addEventListener('input', handler, true);
    document.addEventListener('change', handler, true);
    const interval = setInterval(update, 500);

    return () => {
      document.removeEventListener('input', handler, true);
      document.removeEventListener('change', handler, true);
      clearInterval(interval);
    };
  }, [requiredSelector, onGuardChange]);

  // Auto-avance al clic en botones del paso actual
  useEffect(() => {
    if (!isNextStepVisible || currentTour !== 'main-tour') return;
    if (!stepSelector || !isAdvanceTarget) return;

    const target = document.querySelector(stepSelector);
    if (!target) return;

    const handler = () => {
      if (requireFormValid) {
        const form = target.closest('form');
        if (form && typeof form.checkValidity === 'function' && !form.checkValidity()) {
          return;
        }
      }
      setTimeout(() => {
        setCurrentStep(currentStep + 1, 0);
      }, 350);
    };

    target.addEventListener('click', handler, { once: true });
    return () => target.removeEventListener('click', handler);
  }, [
    currentStep,
    currentTour,
    isNextStepVisible,
    pathname,
    setCurrentStep,
    stepSelector,
    isAdvanceTarget,
    requireFormValid,
  ]);

  // ESC para cerrar el tour
  useEffect(() => {
    if (!isNextStepVisible) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeNextStep();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isNextStepVisible, closeNextStep]);

  return null;
}

export default function OnboardingTour({ children }) {
  const [guard, setGuard] = useState({ requiredSelector: null, filled: true });

  const handleGuardChange = useCallback((next) => {
    setGuard((prev) =>
      prev.requiredSelector === next.requiredSelector && prev.filled === next.filled
        ? prev
        : next
    );
  }, []);

  return (
    <NextStepProvider>
      <TourGuardContext.Provider value={guard}>
        <NextStep
          steps={ONBOARDING_TOUR}
          cardComponent={GuardedTourCard}
          shadowOpacity="0.6"
          scrollToTop={false}
        >
          <OnboardingAutoStart onGuardChange={handleGuardChange} />
          {children}
        </NextStep>
      </TourGuardContext.Provider>
    </NextStepProvider>
  );
}

/**
 * Hook helper para reactivar el tour manualmente.
 */
export function useRestartTour() {
  const { startNextStep } = useNextStep();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  return useCallback(async () => {
    persist.clear();
    try {
      await api.post('/auth/onboarding/reset');
      await fetchMe();
    } catch {}
    startNextStep('main-tour');
  }, [startNextStep, fetchMe]);
}
