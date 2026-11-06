import { IsString, MinLength } from 'class-validator';

export class CreateDependencyDto {
  @IsString({ message: 'La dependencia debe ser un id de subtarea' })
  @MinLength(1, { message: 'La dependencia está vacía' })
  public dependsOnSubtaskId!: string;
}
