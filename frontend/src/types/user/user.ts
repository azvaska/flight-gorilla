import { IPayementCard } from "./payement-card";

export interface IUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  active: boolean;
  nation_id: string | null;
  address: string | null;
  zip: string | null;
  airline_id: string | null;
  cards: IPayementCard[];
  type: 'admin' | 'user' | 'airline';
}
