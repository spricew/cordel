// Contrato interno de los trabajos de la cola de emails.
// `token` va dentro del job porque el worker no puede (ni debe)
// re-consultar la invitación: el job es la orden completa, congelada
// al momento de encolarse.
export interface EmailJob {
  kind: 'invitation';
  to: string;
  organizationName: string;
  inviterName: string;
  token: string;
}
