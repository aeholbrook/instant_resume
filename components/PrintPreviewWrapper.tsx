'use client';

import { useEffect, type ReactNode } from 'react';

export default function PrintPreviewWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add('print-preview');
    document.body.style.margin = '0';
    document.body.style.padding = '0 0.787in';
    return () => {
      document.body.classList.remove('print-preview');
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return <>{children}</>;
}
