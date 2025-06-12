import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtraSchema {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  airline_id!: string;

  @IsBoolean()
  @Type(() => Boolean)
  required_on_all_segments!: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  stackable!: boolean;
}

export class AirlineAircraftSchema {
  @IsInt()
  aircraft_id!: number;

  @IsString()
  airline_id!: string;

  @IsString()
  tail_number!: string;
}

export class AirlineSchema {
  @IsString()
  name!: string;

  @IsInt()
  nation_id!: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsUrl()
  website!: string;
}

export class RouteSchema {
  @IsString()
  flight_number!: string;

  @IsInt()
  departure_airport_id!: number;

  @IsInt()
  arrival_airport_id!: number;

  @IsString()
  airline_id!: string;
}
