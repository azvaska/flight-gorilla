import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Airline } from './Airline';
import { FlightExtra } from './Flight';

@Entity({ name: 'extra' })
export class Extra {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column('uuid')
  airline_id!: string;

  @Column({ default: false })
  required_on_all_segments!: boolean;

  @Column({ default: false })
  stackable!: boolean;

  @ManyToOne(() => Airline, (a) => a.extras)
  airline!: Airline;

  @OneToMany(() => FlightExtra, (fe) => fe.extra)
  flight_extras!: FlightExtra[];
}
