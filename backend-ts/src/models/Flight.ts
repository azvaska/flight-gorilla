import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Airline } from './Airline';
import { Airport } from './Airport';
import { AirlineAircraft } from './AirlineAircraft';
import { Extra } from './Extra';
import { ClassType } from './Common';

@Entity({ name: 'route' })
export class Route {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  flight_number!: string;

  @Column('int')
  departure_airport_id!: number;

  @Column('int')
  arrival_airport_id!: number;

  @Column('uuid')
  airline_id!: string;

  @Column('timestamptz')
  period_start!: Date;

  @Column('timestamptz')
  period_end!: Date;

  @ManyToOne(() => Airport, (a) => a)
  departure_airport!: Airport;

  @ManyToOne(() => Airport, (a) => a)
  arrival_airport!: Airport;

  @ManyToOne(() => Airline, (a) => a.routes)
  airline!: Airline;

  @OneToMany(() => Flight, (f) => f.route)
  flights!: Flight[];
}

@Entity({ name: 'flight' })
export class Flight {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  route_id!: number;

  @Column('uuid')
  aircraft_id!: string;

  @Column('timestamptz')
  departure_time!: Date;

  @Column('timestamptz')
  arrival_time!: Date;

  @Column('timestamptz')
  checkin_start_time!: Date;

  @Column('timestamptz')
  checkin_end_time!: Date;

  @Column('timestamptz')
  boarding_start_time!: Date;

  @Column('timestamptz')
  boarding_end_time!: Date;

  @Column({ nullable: true })
  gate?: string;

  @Column({ nullable: true })
  terminal?: string;

  @Column('float')
  price_first_class!: number;

  @Column('float')
  price_business_class!: number;

  @Column('float')
  price_economy_class!: number;

  @Column('float')
  price_insurance!: number;

  @Column({ default: false })
  fully_booked!: boolean;

  @ManyToOne(() => Route, (r) => r.flights)
  route!: Route;

  @ManyToOne(() => AirlineAircraft, (aa) => aa.flights)
  aircraft!: AirlineAircraft;

  @OneToMany(() => FlightExtra, (fe) => fe.flight)
  available_extras!: FlightExtra[];
}

@Entity({ name: 'flight_extra' })
export class FlightExtra {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  flight_id!: string;

  @Column('uuid')
  extra_id!: string;

  @Column('float')
  price!: number;

  @Column('int')
  limit!: number;

  @ManyToOne(() => Flight, (f) => f.available_extras)
  flight!: Flight;

  @ManyToOne(() => Extra, (e) => e.flight_extras)
  extra!: Extra;
}
