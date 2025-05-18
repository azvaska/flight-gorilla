export interface CreditCard {
  id: number;
  name: string;
  last4: string;
  circuit: 'mastercard' | 'visa';
  expiry: string;
  holder: string;
  type: 'credit' | 'debit' | 'prepaid';
}
