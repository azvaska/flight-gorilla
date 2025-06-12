import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './User';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  permissions?: string;

  @Column('timestamptz', { default: () => 'now()' })
  update_datetime!: Date;

  @ManyToMany(() => User, (u) => u.roles)
  users!: User[];
}
