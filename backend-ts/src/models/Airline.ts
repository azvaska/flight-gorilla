import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Nation } from './Location';
import { AirlineAircraft } from './AirlineAircraft';
import { Route } from './Flight';
import { Extra } from './Extra';

@Entity({ name: 'airline' })
export class Airline {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'int', nullable: true })
  nation_id?: number;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  zip?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'text', nullable: true })
  first_class_description?: string;

  @Column({ type: 'text', nullable: true })
  business_class_description?: string;

  @Column({ type: 'text', nullable: true })
  economy_class_description?: string;

  @ManyToOne(() => Nation, (n) => n.airlines)
  nation?: Nation;

  @OneToMany(() => AirlineAircraft, (aa) => aa.airline)
  aircrafts!: AirlineAircraft[];

  @OneToMany(() => Route, (r) => r.airline)
  routes!: Route[];

  @OneToMany(() => Extra, (e) => e.airline)
  extras!: Extra[];
}
