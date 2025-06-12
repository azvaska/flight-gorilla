import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class FlightSchema {
  @IsInt()
  route_id!: number;

  @IsUUID()
  aircraft_id!: string;

  @IsDateString()
  departure_time!: Date | string;

  @IsDateString()
  arrival_time!: Date | string;

  @IsOptional()
  @IsDateString()
  checkin_start_time?: Date | string;

  @IsOptional()
  @IsDateString()
  checkin_end_time?: Date | string;

  @IsOptional()
  @IsDateString()
  boarding_start_time?: Date | string;

  @IsOptional()
  @IsDateString()
  boarding_end_time?: Date | string;

  @IsOptional()
  @IsString()
  gate?: string;

  @IsOptional()
  @IsString()
  terminal?: string;

  @IsNumber()
  price_first_class!: number;

  @IsNumber()
  price_business_class!: number;

  @IsNumber()
  price_economy_class!: number;

  @IsNumber()
  price_insurance!: number;
}

export class AirlineAircraftSchemaMinified {
  @IsUUID()
  id!: string;

  @IsInt()
  aircraft_id!: number;

  @IsUUID()
  airline_id!: string;

  @IsString()
  tail_number!: string;
}

export class AllFlightSchema {
  @IsUUID()
  id!: string;

  route_id!: number;
  flight_number!: string;
  departure_airport!: any;
  arrival_airport!: any;
  aircraft!: AirlineAircraftSchemaMinified;
  is_editable?: boolean;
}

export class FlightExtraSchema {
  @IsUUID()
  id!: string;

  @IsUUID()
  flight_id!: string;

  @IsUUID()
  extra_id!: string;

  @IsNumber()
  price!: number;

  @IsInt()
  limit!: number;

  name?: string;
  description?: string;
  stackable?: boolean;
  required_on_all_segments?: boolean;
}
