import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AnimatedRadioComponent } from '@/app/components/animated-radio/animated-radio.component';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';

interface Card {
  id: number;
  name: string;
  last4: string;
  circuit: 'mastercard' | 'visa';
  expiry: string;
  holder: string;
  type: 'credit' | 'debit' | 'prepaid';
}

@Component({
  selector: 'app-booking4-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AnimatedRadioComponent,
    HlmInputDirective,
    HlmLabelDirective,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    RouterLink,
    NgIcon,
    HlmIconDirective,
  ],
  templateUrl: './booking4-payment.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class Booking4PaymentComponent {
  cards: Card[] = [
    { id: 1, name: 'Card1', last4: '1236', circuit: 'mastercard', expiry: '08/24', holder: 'Jane Doe', type: 'debit' },
    { id: 2, name: 'Card2', last4: '5421', circuit: 'visa',       expiry: '11/25', holder: 'John Smith', type: 'credit' },
  ];

  selectedCardId: number | 'new' = this.cards[0].id;
  loadingAddCard = false;

  // form model
  newCardData = {
    name: '',
    number: '',
    cvv: '',
    expiry: '',
    holder: '',
    type: 'credit' as 'credit' | 'debit' | 'prepaid',
  };

  // touch/dirty trackers
  holderTouched = false;  holderDirty = false;
  numberTouched = false;  numberDirty = false;
  cvvTouched    = false;  cvvDirty    = false;
  expiryTouched = false;  expiryDirty = false;
  nameTouched   = false;  nameDirty   = false;

  selectCard(id: number | 'new') {
    this.selectedCardId = id;
  }

  get isHolderValid(): boolean {
    const v = this.newCardData.holder.trim();
    return /^[A-Za-z\s]+$/.test(v) && v.length > 0;
  }

  get isCvvValid(): boolean {
    return /^\d{3}$/.test(this.newCardData.cvv);
  }

  get isExpiryValid(): boolean {
    return /^(0[1-9]|1[0-2])\/\d{2}$/.test(this.newCardData.expiry);
  }

  private luhnCheck(num: string): boolean {
    let sum = 0;
    let flip = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = parseInt(num[i], 10);
      if (flip) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      flip = !flip;
    }
    return sum % 10 === 0;
  }

  get isCardNumberValid(): boolean {
    const digits = this.newCardData.number.replace(/\D/g, '');
    return /^\d+$/.test(digits) && this.luhnCheck(digits);
  }

  get isNicknameValid(): boolean {
    const v = this.newCardData.name.trim();
    return /^[A-Za-z0-9\s]+$/.test(v) && v.length > 0;
  }

  get isFormValid(): boolean {
    return (
      this.isHolderValid &&
      this.isCardNumberValid &&
      this.isCvvValid &&
      this.isExpiryValid &&
      this.isNicknameValid
    );
  }

  addCard() {
    if (!this.isFormValid) return;

    this.loadingAddCard = true;

    const nextId = this.cards.length
      ? Math.max(...this.cards.map(c => c.id)) + 1
      : 1;

    const raw = this.newCardData.number.replace(/\D/g, '');
    const last4 = raw.slice(-4);
    const circuit: 'visa' | 'mastercard' = raw.startsWith('4') ? 'visa' : 'mastercard';

    this.cards.push({
      id: nextId,
      name: this.newCardData.name || `Card ${nextId}`,
      last4,
      circuit,
      expiry: this.newCardData.expiry,
      holder: this.newCardData.holder,
      type: this.newCardData.type,
    });

    this.selectedCardId = nextId;

    // reset form + flags
    this.newCardData = { name: '', number: '', cvv: '', expiry: '', holder: '', type: 'credit' };
    this.holderTouched = this.holderDirty = false;
    this.numberTouched = this.numberDirty = false;
    this.cvvTouched    = this.cvvDirty    = false;
    this.expiryTouched = this.expiryDirty = false;
    this.nameTouched   = this.nameDirty   = false;

    this.loadingAddCard = false;
  }
}
