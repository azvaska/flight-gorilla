import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Airport } from './Airport';
import { Airline } from './Airline';
import { User } from './User';

@Entity({ name: 'nation' })
export class Nation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column({ length: 2 })
  alpha2!: string;

  @OneToMany(() => City, (c) => c.nation)
  cities!: City[];

  @OneToMany(() => Airline, (a) => a.nation)
  airlines!: Airline[];

  @OneToMany(() => User, (u) => u.nation)
  users!: User[];
}

@Entity({ name: 'city' })
export class City {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'int', nullable: true })
  nation_id?: number;

  @ManyToOne(() => Nation, (n) => n.cities)
  nation?: Nation;

  @OneToMany(() => Airport, (a) => a.city)
  airports!: Airport[];
}
