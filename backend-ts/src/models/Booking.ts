import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from './User';
import { Flight } from './Flight';
import { Extra } from './Extra';
import { ClassType } from './Common';

@Entity({ name: 'booking' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 10, unique: true })
  booking_number!: string;

  @Column('uuid')
  user_id!: string;

  @Column({ default: false })
  payment_confirmed!: boolean;

  @Column('timestamptz', { nullable: true })
  departure_checkin?: Date;

  @Column('timestamptz', { nullable: true })
  return_checkin?: Date;

  @Column({ default: false })
  has_booking_insurance!: boolean;

  @Column('timestamptz')
  created_at!: Date;

  @ManyToOne(() => User, (u) => u.bookings)
  user!: User;

  @OneToMany(() => BookingDepartureFlight, (df) => df.booking)
  departure_flights!: BookingDepartureFlight[];

  @OneToMany(() => BookingReturnFlight, (rf) => rf.booking)
  return_flights!: BookingReturnFlight[];

  @OneToMany(() => BookingFlightExtra, (bfe) => bfe.booking)
  booking_flight_extras!: BookingFlightExtra[];
}

@Entity({ name: 'booking_flight_extra' })
export class BookingFlightExtra {
  @PrimaryColumn('uuid')
  booking_id!: string;
  @PrimaryColumn('uuid')
  flight_id!: string;
  @PrimaryColumn('uuid')
  extra_id!: string;

  @Column('int')
  quantity!: number;

  @Column('float')
  extra_price!: number;

  @ManyToOne(() => Booking, (b) => b.booking_flight_extras)
  booking!: Booking;

  @ManyToOne(() => Flight, (f) => f)
  flight!: Flight;

  @ManyToOne(() => Extra, (e) => e)
  extra!: Extra;
}

@Entity({ name: 'booking_departure_flight' })
export class BookingDepartureFlight {
  @PrimaryColumn('uuid')
  booking_id!: string;
  @PrimaryColumn('uuid')
  flight_id!: string;

  @Column()
  seat_number!: string;

  @Column({ type: 'enum', enum: ClassType })
  class_type!: ClassType;

  @Column('float')
  price!: number;

  @ManyToOne(() => Booking, (b) => b.departure_flights)
  booking!: Booking;

  @ManyToOne(() => Flight, (f) => f)
  flight!: Flight;

  @OneToMany(() => BookingFlightExtra, (bfe) => bfe)
  extras!: BookingFlightExtra[];
}

@Entity({ name: 'booking_return_flight' })
export class BookingReturnFlight {
  @PrimaryColumn('uuid')
  booking_id!: string;
  @PrimaryColumn('uuid')
  flight_id!: string;

  @Column()
  seat_number!: string;

  @Column({ type: 'enum', enum: ClassType })
  class_type!: ClassType;

  @Column('float')
  price!: number;

  @ManyToOne(() => Booking, (b) => b.return_flights)
  booking!: Booking;

  @ManyToOne(() => Flight, (f) => f)
  flight!: Flight;

  @OneToMany(() => BookingFlightExtra, (bfe) => bfe)
  extras!: BookingFlightExtra[];
}
