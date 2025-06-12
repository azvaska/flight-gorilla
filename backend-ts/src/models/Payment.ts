import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { CardType } from './Common';

@Entity({ name: 'payement_card' })
export class PayementCard {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  card_name!: string;

  @Column()
  holder_name!: string;

  @Column('uuid')
  user_id!: string;

  @Column()
  last_4_digits!: string;

  @Column()
  expiration_date!: string;

  @Column()
  circuit!: string;

  @Column({ type: 'enum', enum: CardType })
  card_type!: CardType;

  @ManyToOne(() => User, (u) => u.cards)
  user!: User;
}
