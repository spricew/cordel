import type { Invitation } from '@cordel/types';

export interface LoginActionState {
  message?: string;
}

export interface RegisterActionState {
  message?: string;
}

export interface CreateOrganizationFieldErrors {
  name?: string;
  slug?: string;
}

export interface CreateOrganizationState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: CreateOrganizationFieldErrors;
}

export interface CreateTeamFieldErrors {
  name?: string;
  slug?: string;
}

export interface CreateTeamState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: CreateTeamFieldErrors;
}

export interface CreateInvitationFieldErrors {
  email?: string;
  role?: string;
}

export interface CreateInvitationState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: CreateInvitationFieldErrors;
  invitation?: Invitation;
}

export interface RevokeInvitationResult {
  ok: boolean;
  message?: string;
}
