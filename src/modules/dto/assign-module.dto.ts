import { IsString, IsNotEmpty } from 'class-validator';

export class AssignModuleDto {
  @IsString()
  @IsNotEmpty()
  role_id: string;
}
