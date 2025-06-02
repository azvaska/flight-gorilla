import {Component, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrnPopoverComponent, BrnPopoverContentDirective, BrnPopoverTriggerDirective} from '@spartan-ng/brain/popover';
import {
  HlmCommandComponent,
  HlmCommandEmptyDirective,
  HlmCommandGroupComponent, HlmCommandIconDirective, HlmCommandItemComponent,
  HlmCommandListComponent, HlmCommandSearchComponent, HlmCommandSearchInputComponent
} from '@spartan-ng/ui-command-helm';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {BrnCommandEmptyDirective} from '@spartan-ng/brain/command';
import {HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {NgForOf, NgIf} from '@angular/common';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {Aircraft} from '@/types/airline/aircraft';
import {lucideCheck, lucideChevronsUpDown, lucideSearch} from '@ng-icons/lucide';
import {randomInt} from '@/utils/random';

@Component({
  selector: 'app-aircraft-add',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrnPopoverComponent,
    HlmCommandComponent,
    NgIcon,
    HlmCommandListComponent,
    HlmCommandGroupComponent,
    BrnCommandEmptyDirective,
    HlmCommandEmptyDirective,
    HlmCommandSearchInputComponent,
    HlmPopoverContentDirective,
    HlmCommandSearchComponent,
    HlmCommandItemComponent,
    HlmCommandIconDirective,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmButtonDirective,
    NgForOf,
    HlmInputDirective,
    HlmLabelDirective,
    NgIf
  ],
  templateUrl: './aircraft-add.component.html',
  providers: [provideIcons({ lucideChevronsUpDown, lucideSearch, lucideCheck })],
  host: {
    class: 'block w-full h-fit',
  },
})
export class AircraftAddComponent {
  aircrafts: Aircraft[] = [
    {
      id: 1,
      name: 'Boeing 737',
      rows: 30,
      unavailableSeats: ['1A', '1B', '2C'],
    },
    {
      id: 2,
      name: 'Airbus A320',
      rows: 32,
      unavailableSeats: ['1A', '1B', '2C', '3D'],
    },
    {
      id: 3,
      name: 'Boeing 777',
      rows: 40,
      unavailableSeats: ['1A', '1B', '2C', '3D', '4E'],
    },
  ];

  public currentModel = signal<Aircraft | undefined>(undefined);
  public state = signal<'closed' | 'open'>('closed');

  constructor () {
    for(let i = 0; i < 10; i++){
      const newAircraft: Aircraft = {
        id: i + 4, // Start from 4 since we already have 3 aircrafts
        name: 'Boeing ' + (randomInt(100, 999)), // Random Boeing models
        rows: randomInt(30, 60), // Incrementing rows for variety
        unavailableSeats: [[["1A", "1B", "3F"], ["2C", "2D", "4E"]][randomInt(0, 1)]].flat() // Random unavailable seats
      };
      this.aircrafts = [...this.aircrafts, newAircraft];
    }
  }

  stateChanged(state: 'open' | 'closed') {
    this.state.set(state);
  }

  commandSelected(aircraft: Aircraft) {
    this.state.set('closed');
    if (this.currentModel()?.name === aircraft.name) {
      this.currentModel.set(undefined);
    } else {
      this.currentModel.set(aircraft);
    }
  }
}
