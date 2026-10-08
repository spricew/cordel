import { IsString } from 'class-validator';

export class SessionDto {
    @IsString()
    public token!: string;    
}

