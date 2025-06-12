import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { City } from './Location';

@Entity({ name: 'airport' })
export class Airport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ length: 3, unique: true, nullable: true })
  iata_code?: string;

  @Column({ length: 4, nullable: true })
  icao_code?: string;

  @Column('float')
  latitude!: number;

  @Column('float')
  longitude!: number;

  @Column('int')
  city_id!: number;

  @ManyToOne(() => City, (c) => c.airports)
  city!: City;
}
