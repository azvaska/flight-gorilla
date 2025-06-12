import { IsInt, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class AirportSchema {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  iata_code?: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  icao_code?: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsInt()
  city_id!: number;
}
