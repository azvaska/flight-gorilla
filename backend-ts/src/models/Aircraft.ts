import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AirlineAircraft } from './AirlineAircraft';

@Entity({ name: 'aircraft' })
export class Aircraft {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  rows!: number;

  @Column()
  columns!: number;

  @Column('text', { array: true })
  unavailable_seats!: string[];

  @OneToMany(() => AirlineAircraft, (aa) => aa.aircraft)
  airline_aircrafts!: AirlineAircraft[];
}
