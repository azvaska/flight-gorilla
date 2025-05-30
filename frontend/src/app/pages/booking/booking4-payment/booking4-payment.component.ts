import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AnimatedRadioComponent } from '@/app/components/ui/animated-radio/animated-radio.component';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import {CreditCardListComponent} from '@/app/components/user/credit-card-list/credit-card-list.component';
import {CreditCard} from '@/types/credit-card';


@Component({
  selector: 'app-booking4-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonDirective,
    RouterLink,
    CreditCardListComponent,
  ],
  templateUrl: './booking4-payment.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class Booking4PaymentComponent {
  selectedCardId: number | 'new' = 1;

  cards: CreditCard[] = [
    { id: 1, name: 'Card1', last4: '1236', circuit: 'mastercard', expiry: '08/24', holder: 'Jane Doe', type: 'debit' },
    { id: 2, name: 'Card2', last4: '5421', circuit: 'visa',       expiry: '11/25', holder: 'John Smith', type: 'credit' },
  ];
}
