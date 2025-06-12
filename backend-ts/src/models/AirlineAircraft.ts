import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Airline } from './Airline';
import { Aircraft } from './Aircraft';
import { AirlineAircraftSeat } from './AirlineAircraftSeat';
import { Flight } from './Flight';

@Entity({ name: 'airline_aircraft' })
export class AirlineAircraft {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  aircraft_id!: number;

  @Column('uuid')
  airline_id!: string;

  @Column({ unique: true })
  tail_number!: string;

  @ManyToOne(() => Airline, (a) => a.aircrafts)
  airline!: Airline;

  @ManyToOne(() => Aircraft, (a) => a.airline_aircrafts)
  aircraft!: Aircraft;

  @OneToMany(() => AirlineAircraftSeat, (s) => s.airline_aircraft)
  seats!: AirlineAircraftSeat[];

  @OneToMany(() => Flight, (f) => f.aircraft)
  flights!: Flight[];
}
