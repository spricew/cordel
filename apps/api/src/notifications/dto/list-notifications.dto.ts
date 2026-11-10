import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListNotificationsDto {
  /* ?unread=true → solo las no leídas. Viene como string de la query:
   * se convierte a boolean aquí. */
  @Transform(({ value }: { value: unknown }): unknown => {
    if (value === undefined) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  @IsBoolean({ message: 'El filtro unread debe ser true o false' })
  public unread?: boolean;
}
