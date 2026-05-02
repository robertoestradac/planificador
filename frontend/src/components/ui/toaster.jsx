'use client';
import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle2, XCircle, AlertCircle, Info, Sparkles } from 'lucide-react';

const variantIcons = {
  default: Sparkles,
  success: CheckCircle2,
  destructive: XCircle,
  warning: AlertCircle,
  info: Info,
};

const variantIconColors = {
  default: 'text-violet-600',
  success: 'text-green-600',
  destructive: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
};

export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant = 'default', ...props }) => {
        const Icon = variantIcons[variant] || variantIcons.default;
        const iconColor = variantIconColors[variant] || variantIconColors.default;
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              <div className={`flex-shrink-0 ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
