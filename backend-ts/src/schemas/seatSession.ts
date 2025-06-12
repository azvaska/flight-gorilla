import { IsArray, IsEnum, IsUUID, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassType } from '../models/Common';

export class SeatSchema {
  @IsUUID()
  flight_id!: string;

  @IsString()
  seat_number!: string;

  @IsEnum(ClassType)
  class_type!: ClassType;
}

export class SeatSessionSchema {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  flight_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatSchema)
  seats!: SeatSchema[];
}
