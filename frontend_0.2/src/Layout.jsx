import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-neutral-100 dark:bg-slate-950 transition-colors">
        {children}
      </div>
      <Toaster />
    </ThemeProvider>
  );
}