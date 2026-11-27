'use server';

import { revalidatePath } from 'next/cache';

import { authFetch } from '@/lib/api';
import { executeAcceptInvitation } from '@/lib/organizations/accept-invitation';
import type { AcceptInvitationState } from '@/types';

export async function acceptInvitationAction(
  _previousState: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  return executeAcceptInvitation(formData, {
    fetchWithAuth: authFetch,
    revalidate: revalidatePath,
  });
}
