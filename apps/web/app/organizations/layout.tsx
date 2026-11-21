import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { Navbar } from '@/components/layout/Navbar';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function OrganizationsLayout({ children }: { children: ReactNode }) {
  if ((await getCurrentUser()) === null) {
    redirect('/session-expired');
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
