import { IsInt, IsString, Length, Min } from 'class-validator';

export class AircraftSchema {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsInt()
  @Min(1)
  rows!: number;

  @IsInt()
  @Min(1)
  columns!: number;
}
