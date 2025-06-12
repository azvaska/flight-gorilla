import { Entity, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { AirlineAircraft } from './AirlineAircraft';
import { ClassType } from './Common';

@Entity({ name: 'airline_aircraft_seat' })
export class AirlineAircraftSeat {
  @PrimaryColumn('uuid')
  airline_aircraft_id!: string;

  @PrimaryColumn()
  seat_number!: string;

  @Column({ type: 'enum', enum: ClassType })
  class_type!: ClassType;

  @ManyToOne(() => AirlineAircraft, (aa) => aa.seats)
  airline_aircraft!: AirlineAircraft;
}
