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
