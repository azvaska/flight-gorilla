import { IsInt, IsOptional, IsString } from 'class-validator';

export class NationSchema {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  alpha2!: string;
}

export class CitySchema {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  nation_id?: number;
}
