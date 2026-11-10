import { IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString({ message: 'El token debe ser texto' })
  @MinLength(1, { message: 'El token es obligatorio' })
  public token!: string;
}
