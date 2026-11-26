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
