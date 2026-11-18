import type { ReactNode } from 'react';

import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full shrink-0 flex-col">
      <MarketingNavbar />
      {children}
    </div>
  );
}
