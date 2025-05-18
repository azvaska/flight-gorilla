// src/app/my-profile/my-profile.component.ts
import { Component } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {CreditCardListComponent} from '@/app/components/credit-card-list/credit-card-list.component';
import {CreditCard} from '@/types/credit-card';

interface UserInfo {
  email:    string;
  password: string;
  name:     string;
  surname:  string;
  address:  string;
  zipCode:  string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    HlmButtonDirective,
    CreditCardListComponent
  ],
  host: {
    class: 'block w-full h-full',
  },
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent {
  user: UserInfo = {
    email:    'user@example.com',
    password: '••••••••',
    name:     'John',
    surname:  'Doe',
    address:  '123 Main St, Anytown',
    zipCode:  '12345'
  };

  selectedCardId: number | 'new' = 1;

  cards: CreditCard[] = [
    { id: 1, name: 'Card1', last4: '1236', circuit: 'mastercard', expiry: '08/24', holder: 'Jane Doe', type: 'debit' },
    { id: 2, name: 'Card2', last4: '5421', circuit: 'visa',       expiry: '11/25', holder: 'John Smith', type: 'credit' },
  ];


  editProfile() {
    console.log(`Edit profile for ${this.user.email}`);
    // TODO: navigate to an edit form or open a modal
    // this.router.navigate(['edit'], { relativeTo: this.route });
  }

}
