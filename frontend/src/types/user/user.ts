import { INation } from "../search/location";
import { IPayementCard } from "./payement-card";

export type Role = 'admin' | 'user' | 'airline-admin';

export interface IUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  active: boolean;
  nation: INation;
  address: string | null;
  zip: string | null;
  airline_id: string | null;
  cards: IPayementCard[];
  type: Role;
}
