import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Nation } from './Location';
import { Airline } from './Airline';
import { Booking } from './Booking';
import { PayementCard } from './Payment';
import { Role } from './Role';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column()
  surname!: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  zip?: string;

  @Column({ type: 'int', nullable: true })
  nation_id?: number;

  @Column({ type: 'uuid', nullable: true })
  airline_id?: string;

  @Column({ default: true })
  active!: boolean;

  @ManyToMany(() => Role, (r) => r.users, { eager: true })
  @JoinTable({
    name: 'roles_users',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles!: Role[];

  @ManyToOne(() => Nation, (n) => n.users)
  nation?: Nation;

  @ManyToOne(() => Airline, (a) => a)
  airline?: Airline;

  @OneToMany(() => Booking, (b) => b.user)
  bookings!: Booking[];

  @OneToMany(() => PayementCard, (c) => c.user)
  cards!: PayementCard[];

  get type(): string | undefined {
    return this.roles?.[0]?.name;
  }
}
