import { IsArray, IsBoolean, IsInt, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtraInputSchema {
  @IsUUID()
  id!: string;

  @IsInt()
  quantity!: number;
}

export class BookingInputSchema {
  @IsUUID()
  session_id!: string;

  @IsArray()
  @IsUUID('all', { each: true })
  departure_flights!: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  return_flights!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraInputSchema)
  extras!: ExtraInputSchema[];

  @IsBoolean()
  has_booking_insurance!: boolean;
}

export class BookingFlightExtraSchema {
  @IsUUID()
  extra_id!: string;

  @IsInt()
  quantity!: number;

  @IsInt()
  extra_price!: number;

  name?: string;
  description?: string;
}

export class BookedFlightSchema {
  @IsUUID()
  id!: string;

  flight: any;
  seat_number!: string;
  class_type!: string;
  price!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingFlightExtraSchema)
  extras!: BookingFlightExtraSchema[];
}

export class BookingOutputSchema {
  @IsUUID()
  id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookedFlightSchema)
  departure_flights!: BookedFlightSchema[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookedFlightSchema)
  return_flights!: BookedFlightSchema[];

  booking_number!: string;
  total_price!: number;
  is_insurance_purchased!: boolean;
  insurance_price?: number;
}
