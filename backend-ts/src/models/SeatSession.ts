import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from './User';
import { ClassType } from './Common';
import { Flight } from './Flight';

@Entity({ name: 'seat_session' })
export class SeatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  user_id!: string;

  @Column('timestamptz')
  session_start_time!: Date;

  @Column('timestamptz')
  session_end_time!: Date;

  @ManyToOne(() => User, (u) => u)
  user!: User;

  @OneToMany(() => Seat, (s) => s.session)
  seats!: Seat[];
}

@Entity({ name: 'seat' })
export class Seat {
  @PrimaryColumn('uuid')
  session_id!: string;
  @PrimaryColumn('uuid')
  flight_id!: string;

  @Column()
  seat_number!: string;

  @Column({ type: 'enum', enum: ClassType })
  class_type!: ClassType;

  @ManyToOne(() => SeatSession, (ss) => ss.seats)
  session!: SeatSession;

  @ManyToOne(() => Flight, (f) => f)
  flight!: Flight;
}
