export type ILocation =
  | {
      id: string;
      name: string;
      type: 'city' | 'airport' | 'nation';
    }
  | {
      id: undefined;
      name: 'Anywhere';
      type: 'anywhere';
    };


export interface INation {
  id: number;
  name: string;
  code: string;
  alpha2: string;
}

export interface ICity {
  id: string;
  name: string;
  nation: INation;
}
