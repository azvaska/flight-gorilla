import { Component, Input } from '@angular/core';
import {NgClass, NgForOf, NgOptimizedImage} from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { ExtraLineComponent} from '@/app/components/booking/extra-line/extra-line.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-booking3-extra',
  standalone: true,
  imports: [
    NgOptimizedImage,
    HlmButtonDirective,
    ExtraLineComponent,
    NgForOf,
    NgClass,
    RouterLink
  ],
  templateUrl: './booking3-extra.component.html',
  styleUrls: ['./booking3-extra.component.css']
})
export class Booking3ExtraComponent {
  @Input() flexSelected = false;


  // your extras data
  extras = [
    {
      title:       'Luggage',
      description: 'Up to 2 pieces of 23 kg each',
      isStackable: true,
      price:       30,
      quantity:    0,
      selected:    false
    },
    {
      title:       'WiFi Access',
      description: 'Unlimited in-flight internet',
      isStackable: false,
      price:       10,
      quantity:    0,
      selected:    false
    },
    {
      title:       'Priority Boarding',
      description: 'Board the plane first',
      isStackable: false,
      price:       20,
      quantity:    0,
      selected:    false
    },
    {
      title:       'Extra test',
      description: 'More test for your code',
      isStackable: false,
      price:       15,
      quantity:    0,
      selected:    false
    },
    {
      title:       'Test amount',
      description: 'More amount of test for the test',
      isStackable: true,
      price:       15,
      quantity:    0,
      selected:    false
    },
    {
      title:       'Test amount',
      description: 'More amount of test for the test',
      isStackable: false,
      price:       15,
      quantity:    0,
      selected:    false
    },
    {
      title:       'Test amount',
      description: 'More amount of test for the test',
      isStackable: false,
      price:       15,
      quantity:    0,
      selected:    false
    },
    {
      title:       'Test amount',
      description: 'More amount of test for the test',
      isStackable: false,
      price:       15,
      quantity:    0,
      selected:    false
    }
  ];

  get total() {
    // @ts-ignore
    return this.flexSelected*23.99 + this.extras.reduce((sum, e) => {
      return sum + (e.isStackable
        ? e.price * e.quantity
        : (e.selected ? e.price : 0));
    }, 0);
  }
}
