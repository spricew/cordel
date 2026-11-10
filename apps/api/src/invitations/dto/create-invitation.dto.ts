import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  /* Email normalizado: minúsculas y sin espacios. Es la llave de la
   * invitación (quien acepta entra con ESTA cuenta). */
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no es válido' })
  public email!: string;

  /* OWNER no se invita: una organización ya tiene dueño. */
  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER'], { message: 'El rol debe ser ADMIN o MEMBER' })
  public role?: 'ADMIN' | 'MEMBER';
}
