import { IsEmail, IsInt, IsOptional, IsString, Length, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CardType } from '../models/Common';

export class DebitCardSchema {
  @IsString()
  card_name!: string;

  @IsString()
  holder_name!: string;

  @IsUUID()
  user_id!: string;

  @IsString()
  last_4_digits!: string;

  @IsString()
  expiration_date!: string;

  @IsString()
  circuit!: string;

  card_type!: CardType;
}

export class UserSchema {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 100)
  surname!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @IsInt()
  nation_id?: number;

  @IsOptional()
  @IsUUID()
  airline_id?: string;

  active?: boolean;

  @ValidateNested({ each: true })
  @Type(() => DebitCardSchema)
  cards?: DebitCardSchema[];

  type?: string;
}
