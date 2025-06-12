import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class FlightSearchResultSchema {
  @IsString()
  id!: string;

  @IsString()
  flight_number!: string;

  @IsString()
  airline_name!: string;

  @IsString()
  airline_id!: string;

  @IsString()
  departure_airport!: string;

  @IsString()
  arrival_airport!: string;

  @IsDateString()
  departure_time!: string;

  @IsDateString()
  arrival_time!: string;

  @IsInt()
  duration_minutes!: number;

  @IsNumber()
  price_economy!: number;

  @IsNumber()
  price_business!: number;

  @IsNumber()
  price_first!: number;

  @IsInt()
  available_economy_seats!: number;

  @IsInt()
  available_business_seats!: number;

  @IsInt()
  available_first_seats!: number;

  @IsString()
  aircraft_name!: string;

  @IsOptional()
  @IsString()
  gate?: string;

  @IsOptional()
  @IsString()
  terminal?: string;
}
