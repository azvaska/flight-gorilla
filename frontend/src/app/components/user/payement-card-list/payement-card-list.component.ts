import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';

import { AnimatedRadioComponent } from '@/app/components/ui/animated-radio/animated-radio.component';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { IPayementCard } from '@/types/user/payement-card';
import { luhnCheck } from '@/utils/cards';
import { UserFetchService } from '@/app/services/user/user-fetch.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'payement-card-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AnimatedRadioComponent,
    HlmInputDirective,
    HlmLabelDirective,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    NgIcon,
    HlmIconDirective,
  ],
  templateUrl: './payement-card-list.component.html',
  providers: [provideIcons({ lucideLoaderCircle })],
})
export class PayementCardListComponent implements OnInit {
  @Input() canDelete = false;

  @Input() cards: IPayementCard[] = [];

  protected localSelectedCardId: number | 'new' | undefined;
  @Output() selectedCardId = new EventEmitter<number | 'new'>();

  protected loadingAddCard = false;
  protected loadingRemoveCard: boolean[] = [];
  protected addCardError: string | null = null;
  protected removeCardError: string | null = null;

  // Reactive form for adding new card
  newCardForm = new FormGroup({
    holder: new FormControl('', [
      Validators.required,
      Validators.pattern('^[A-Za-z\\s]+$'),
    ]),
    number: new FormControl('', [
      Validators.required,
      Validators.pattern('^\\d{16}$'),
    ]),
    cvv: new FormControl('', [
      Validators.required,
      Validators.pattern('^\\d{3}$'),
    ]),
    expiry: new FormControl('', [
      Validators.required,
      Validators.pattern('^(0[1-9]|1[0-2])\\/\\d{2}$'),
    ]),
    name: new FormControl('', [
      Validators.required,
      Validators.pattern('^[A-Za-z0-9\\s]+$'),
    ]),
    type: new FormControl('credit', Validators.required),
  });

  constructor(private userFetchService: UserFetchService) {}

  ngOnInit(): void {
    this.localSelectedCardId = this.cards.length ? this.cards[0].id : 'new';
    this.loadingRemoveCard = new Array(this.cards.length).fill(false);
  }

  protected selectCard(id: number | 'new') {
    this.localSelectedCardId = id;
    this.selectedCardId.emit(id);
    // Reset errors when selecting a different card
    this.addCardError = null;
    this.removeCardError = null;
  }

  protected async addCard() {
    if (this.newCardForm.invalid) return;

    this.loadingAddCard = true;
    this.addCardError = null;

    try {
      const rawCardNumber = (this.newCardForm.value.number as string).replace(
        /\D/g,
        ''
      );
      if (!luhnCheck(rawCardNumber)) {
        this.newCardForm.controls['number'].setErrors({ invalidLuhn: true });
        this.loadingAddCard = false;
        return;
      }

      const newCard = await firstValueFrom(this.userFetchService
        .addPayementCard({
          holder_name: this.newCardForm.value.holder as string,
          card_name: this.newCardForm.value.name as string,
          last_4_digits: rawCardNumber.slice(-4),
          circuit: rawCardNumber.startsWith('4') ? 'visa' : 'mastercard',
          expiration_date: this.newCardForm.value.expiry as string,
          card_type: this.newCardForm.value.type!.toUpperCase() as 'DEBIT' | 'CREDIT' | 'PREPAID',
        })
      );

      if (!newCard) {
        this.addCardError = 'Unknown error';
        this.loadingAddCard = false;
        return;
      }

      this.selectCard(newCard.id);
      this.cards.push(newCard);

      // reset form + flags
      this.newCardForm.reset({ type: 'credit' });
      this.loadingAddCard = false;
    } catch (error: any) {
      console.error('Error adding payment card:', error);
      this.addCardError = 'Unknown error';
      this.loadingAddCard = false;
    }
  }

  protected async removeCard(id: number) {
    this.loadingRemoveCard[id] = true;
    this.removeCardError = null;

    try {
      await firstValueFrom(this.userFetchService.deletePayementCard(id));
      this.cards = this.cards.filter((c) => c.id !== id);
      this.loadingRemoveCard[id] = false;

      if (this.localSelectedCardId === id) {
        this.localSelectedCardId = this.cards.length ? this.cards[0].id : 'new';
        this.selectedCardId.emit(this.localSelectedCardId);
      }
    } catch (error: any) {
      console.error('Error removing payment card:', error);
      this.removeCardError = 'Unknown error';
      this.loadingRemoveCard[id] = false;
    }
  }

  dummyFillValues() {
    this.newCardForm.setValue({
      name: 'Amongas card',
      number: '4916338947448931',
      cvv: '123',
      expiry: '12/25',
      holder: 'John Doe',
      type: 'credit',
    });
  }
}
