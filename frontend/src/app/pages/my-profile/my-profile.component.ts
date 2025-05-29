// src/app/my-profile/my-profile.component.ts
import { Component } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {CreditCardListComponent} from '@/app/components/credit-card-list/credit-card-list.component';
import {CreditCard} from '@/types/credit-card';
import {UserInfo} from '@/types/user-info';
import {ProfileComponent} from '@/app/components/profile/profile.component';
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

  cards: CreditCard[] = [
    { id: 1, name: 'Card1', last4: '1236', circuit: 'mastercard', expiry: '08/24', holder: 'Jane Doe', type: 'debit' },
    { id: 2, name: 'Card2', last4: '5421', circuit: 'visa',       expiry: '11/25', holder: 'John Smith', type: 'credit' },
  ];

  editingProfile = false;

  editProfile() {
    this.editingProfile = !this.editingProfile;
  }

}
