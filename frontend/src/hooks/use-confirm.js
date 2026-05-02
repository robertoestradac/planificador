'use client';
import { create } from 'zustand';

const useConfirmStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'default',
  onConfirm: null,
  onCancel: null,
  
  openConfirm: (config) => set({
    isOpen: true,
    title: config.title || '¿Estás seguro?',
    message: config.message || '',
    confirmText: config.confirmText || 'Confirmar',
    cancelText: config.cancelText || 'Cancelar',
    variant: config.variant || 'default',
    onConfirm: config.onConfirm,
    onCancel: config.onCancel,
  }),
  
  closeConfirm: () => set({
    isOpen: false,
    onConfirm: null,
    onCancel: null,
  }),
}));

/**
 * Hook para mostrar diálogos de confirmación bonitos
 * 
 * @example
 * const confirm = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '¿Eliminar usuario?',
 *     message: 'Esta acción no se puede deshacer.',
 *     variant: 'danger',
 *     confirmText: 'Eliminar',
 *   });
 *   
 *   if (confirmed) {
 *     // Realizar la acción
 *   }
 * };
 */
export function useConfirm() {
  const openConfirm = useConfirmStore((state) => state.openConfirm);
  
  return (config) => {
    return new Promise((resolve) => {
      openConfirm({
        ...config,
        onConfirm: () => {
          resolve(true);
          config.onConfirm?.();
        },
        onCancel: () => {
          resolve(false);
          config.onCancel?.();
        },
      });
    });
  };
}

export { useConfirmStore };
