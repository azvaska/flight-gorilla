// src/app/my-profile/my-profile.component.ts
import { Component } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {CreditCardListComponent} from '@/app/components/user/credit-card-list/credit-card-list.component';
import {IPayementCard} from '@/types/user/payement-card';
import {UserInfo} from '@/types/user/user-info';
import {ProfileComponent} from '@/app/components/user/profile/profile.component';
import {NgClass} from '@angular/common';


@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CreditCardListComponent,
    ProfileComponent,
    NgClass
  ],
  host: {
    class: 'block w-full h-full',
  },
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent {
  user: UserInfo = {
    email:    'user@example.com',
    password: '',
    name:     'John',
    surname:  'Doe',
    address:  '123 Main St, Anytown',
    zipCode:  '12345'
  };

  selectedCardId: number | 'new' = 1;

  cards: IPayementCard[] = [
    { id: 1, card_name: 'Card1', last_4_digits: '1236', circuit: 'mastercard', expiration_date: '08/24', holder_name: 'Jane Doe', card_type: 'DEBIT' },
    { id: 2, card_name: 'Card2', last_4_digits: '5421', circuit: 'visa',       expiration_date: '11/25', holder_name: 'John Smith', card_type: 'CREDIT' },
  ];

  editingProfile = false;

  editProfile() {
    this.editingProfile = !this.editingProfile;
  }

}
