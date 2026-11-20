import type { Metadata } from 'next';

import { DEMO_ORGANIZATIONS } from '@components/organizations/data';
import { OrganizationsExplorer } from '@components/organizations/OrganizationsExplorer';

export const metadata: Metadata = {
  title: 'Organizaciones',
};

export default function Organizations() {
  return <OrganizationsExplorer organizations={DEMO_ORGANIZATIONS} />;
}
