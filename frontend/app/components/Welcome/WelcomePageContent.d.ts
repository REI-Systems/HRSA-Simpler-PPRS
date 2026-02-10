import type { FC, ReactNode } from 'react';

export interface WelcomePageContentProps {
  plans?: unknown[];
  welcomeMessage?: { title: string; message: string } | null;
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
}

declare const WelcomePageContent: FC<WelcomePageContentProps>;
export default WelcomePageContent;
