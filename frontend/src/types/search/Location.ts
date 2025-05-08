export type ILocation =
  | {
      id: string;
      name: string;
      type: 'city' | 'airport' | 'country';
    }
  | {
      id: undefined;
      name: 'Anywhere';
      type: 'anywhere';
    };
