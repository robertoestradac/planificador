'use client';
import { useEffect } from 'react';

export default function AdminWhatsAppRedirect() {
  useEffect(() => {
    window.open('/wa', '_blank', 'noopener,noreferrer');
    window.history.back();
  }, []);
  return null;
}
