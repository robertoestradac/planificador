'use client';
import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Trash2, CheckCircle2 } from 'lucide-react';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-[301] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-2 bg-white p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-3xl',
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn('text-lg font-bold', className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn('text-sm text-gray-600', className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-2 text-sm font-bold text-white transition-all hover:from-violet-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      'mt-2 sm:mt-0 inline-flex h-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// Custom Confirm Dialog Component
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  variant = 'default', // 'default', 'danger', 'warning', 'success'
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
    onClose?.();
  };

  const handleCancel = () => {
    onOpenChange?.(false);
    onClose?.();
  };

  const variantConfig = {
    default: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      borderColor: 'border-blue-200',
      buttonClass: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-400',
    },
    danger: {
      icon: Trash2,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      borderColor: 'border-red-200',
      buttonClass: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-400',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      borderColor: 'border-amber-200',
      buttonClass: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:ring-amber-400',
    },
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      borderColor: 'border-green-200',
      buttonClass: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-400',
    },
  };

  const config = variantConfig[variant] || variantConfig.default;
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={config.borderColor}>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 pt-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">{message}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className={config.buttonClass}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
