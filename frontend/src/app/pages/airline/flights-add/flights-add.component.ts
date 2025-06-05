import {Component, signal} from '@angular/core';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {BrnPopoverComponent, BrnPopoverContentDirective, BrnPopoverTriggerDirective} from '@spartan-ng/brain/popover';
import {HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {
  HlmCommandComponent, HlmCommandEmptyDirective,
  HlmCommandGroupComponent, HlmCommandIconDirective, HlmCommandItemComponent,
  HlmCommandListComponent,
  HlmCommandSearchComponent, HlmCommandSearchInputComponent
} from '@spartan-ng/ui-command-helm';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideCheck, lucideChevronsUpDown, lucideSearch} from '@ng-icons/lucide';
import {BrnCommandEmptyDirective} from '@spartan-ng/brain/command';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {CreditCardListComponent} from '@/app/components/user/credit-card-list/credit-card-list.component';
import {RouterLink} from '@angular/router';
import {dateToString, formatTime} from '@/utils/date';
import {FormsModule} from '@angular/forms';

interface Route {
  id: number;
  name: string;
}

interface Extra {
  id: number;
  name: string;
  description: string;
  price: number;
  limit: number;
  stackable: boolean;
}

@Component({
  selector: 'app-flights-add',
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    BrnPopoverComponent,
    BrnPopoverTriggerDirective,
    BrnPopoverContentDirective,
    HlmPopoverContentDirective,
    HlmCommandComponent,
    NgIcon,
    HlmCommandSearchComponent,
    HlmCommandListComponent,
    HlmCommandGroupComponent,
    HlmCommandItemComponent,
    HlmCommandIconDirective,
    BrnCommandEmptyDirective,
    HlmCommandEmptyDirective,
    HlmCommandSearchInputComponent,
    NgForOf,
    NgClass,
    CreditCardListComponent,
    NgOptimizedImage,
    RouterLink,
    NgIf,
    FormsModule
  ],
  providers: [provideIcons({ lucideChevronsUpDown, lucideSearch, lucideCheck })],
  templateUrl: './flights-add.component.html'
})
export class FlightsAddComponent {
  routes: Route[] = [
    { id: 1, name: 'VCE-CTA  02/25-09/25' },
    { id: 2, name: 'FCO-CTA  04/24-02/27' },
    { id: 3, name: 'MXP-CTA  05/25-03/26' },
    { id: 4, name: 'NAP-CTA  12/24-07/28' },
    { id: 5, name: 'TRN-CTA  01/25-06/25' },
    { id: 6, name: 'BLQ-CTA  11/22-07/26' },
    { id: 7, name: 'PMO-CTA  03/25-09/26' },
    { id: 8, name: 'PSR-CTA  09/25-12/29' }
  ]

  availableExtras: Extra[] = [
    { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 0, limit: 1, stackable: true },
    { id: 2, name: 'Priority Boarding', description: 'Board the plane first', price: 0, limit: 1, stackable: false },
    { id: 3, name: 'Seat Selection', description: 'Select your preferred seat', price: 0, limit: 1, stackable: false },
    { id: 4, name: 'In-Flight Meal', description: 'Enjoy a meal during your flight', price: 0, limit: 1, stackable: true },
    { id: 5, name: 'Wi-Fi Access', description: 'Stay connected with in-flight Wi-Fi', price: 0, limit: 1, stackable: false }
  ]
  extras: Extra[] = [
    { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 1, stackable: false },
    { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 65, limit: 1, stackable: false },
    // { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 0, stackable: false },
    // { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 0, stackable: false },
    // { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 0, stackable: false },
    // { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 0, stackable: false },
    // { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 0, stackable: false },
    // { id: 1, name: 'Extra Baggage', description: 'Add an extra baggage to your flight', price: 59, limit: 0, stackable: false },
  ];

  // Route popover
  public currentRoute = signal<Route | undefined>(undefined);
  public state1 = signal<'closed' | 'open'>('closed');

  // Extra popover
  public currentExtra = signal<Extra | undefined>(undefined);
  public state2 = signal<'closed' | 'open'>('closed');

  // extras Popup
  protected extrasDetail: 'new' | number | null = null;
  protected extraPrice = 0;
  protected extraLimit = 1;

  // page switcher (forms-extras)
  protected page: 'forms' | 'extras' = 'forms';

  state1Changed(state: 'open' | 'closed') {
    this.state1.set(state);
  }

  command1Selected(route: Route) {
    if (this.currentRoute()?.name !== route.name) {
      this.currentRoute.set(route);
    }
    this.state1.set('closed');
  }

  state2Changed(state: 'open' | 'closed') {
    this.state2.set(state);
  }

  command2Selected(extra: Extra) {
    if (this.currentExtra()?.name !== extra.name) {
      this.currentExtra.set(extra);
    }
    this.state2.set('closed');
  }

  get showForms() {
    return this.page === 'forms' && this.currentRoute();
  }
  get showExtras(){
    return this.page === 'extras' && this.currentRoute();
  }

  protected readonly formatTime = formatTime;
  protected readonly dateToString = dateToString;

  closeDetails() {
    this.extrasDetail = null;
    this.currentExtra.set(undefined);
    this.extraPrice = 0;
  }
  openDetails(type: 'new' | number) {
    this.extrasDetail = type;
    if(type == 'new'){
      this.currentExtra.set(undefined);
    } else {
      this.currentExtra.set(this.extras[type]);
      this.extraPrice = this.extras[type].price;
      this.extraLimit = this.extras[type].limit;
    }
  }
  saveExtra() {
    if (this.extrasDetail === 'new') {
      // Add new extra logic
      const newExtra: Extra = {
        id: this.availableExtras.length + 1,
        name: this.currentExtra()!.name,
        description: this.currentExtra()!.description,
        price: this.extraPrice,
        limit: this.extraLimit,
        stackable: this.currentExtra()!.stackable
      };
      this.extras.push(newExtra);
    } else if (typeof this.extrasDetail === 'number') {
      this.extras[this.extrasDetail].price = this.extraPrice;
      this.extras[this.extrasDetail].limit = this.extraLimit;
    }
    this.closeDetails();
  }

  protected readonly Math = Math;
}
