export interface IPayementCard {
  id: number;
  holder_name: string;
  card_name: string;
  last_4_digits: string;
  expiration_date: string;
  circuit: 'visa' | 'mastercard';
  card_type: 'DEBIT' | 'CREDIT' | 'PREPAID';
}
