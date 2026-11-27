import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El token debe ser texto' })
  @MinLength(1, { message: 'El token es obligatorio' })
  @MaxLength(256, { message: 'El token no es válido' })
  public token!: string;
}
