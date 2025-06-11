import { INation } from "../search/location";

export interface IAirlineUser {
  id: string;
  email: string;
  name: string;
  surname: string;
  address: string;
  zip: string;
  nation: INation;
  active: boolean;
  type: string;
}

export interface IAdminAirline {
  id: string;
  name: string;
  nation: INation;
  address: string;
  zip: string;
  email: string;
  website: string;
  first_class_description: string;
  business_class_description: string;
  economy_class_description: string;
  user: IAirlineUser;
  active: boolean;
  type: string;
}
