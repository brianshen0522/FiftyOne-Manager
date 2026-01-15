"use client";

import { LanguageProvider } from './LanguageProvider';

export default function ClientProviders({ children }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
