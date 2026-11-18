import type { ReactNode } from 'react';

import { Navbar } from '@/components/layout/Navbar';

export default function OrganizationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
